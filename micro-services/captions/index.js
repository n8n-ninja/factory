import express from "express"
import axios from "axios"
import fs from "fs"
import path from "path"
import { execSync } from "child_process"
import { OpenAI } from "openai"

const app = express()
const port = process.env.PORT || 3000
const tmp = "/tmp"
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

app.use(express.json())

/**
 * 🔐 Protection middleware
 */
app.use((req, res, next) => {
  const token = req.headers.authorization
  const expected = process.env.ACCESS_TOKEN
  if (!expected || token !== `Bearer ${expected}`) {
    return res.status(401).json({ error: "Unauthorized" })
  }
  next()
})

/**
 * 🎧 /mp3?url=...
 * Downloads a video and returns the raw MP3
 */
app.post("/mp3", async (req, res) => {
  const videoUrl = req.body.url
  if (!videoUrl) return res.status(400).send("Missing url")

  const videoPath = path.join(tmp, "input.mp4")
  const audioPath = path.join(tmp, "output.mp3")

  try {
    const response = await axios.get(videoUrl, { responseType: "stream" })
    const writer = fs.createWriteStream(videoPath)
    await new Promise((resolve, reject) => {
      response.data.pipe(writer)
      writer.on("finish", resolve)
      writer.on("error", reject)
    })

    execSync(
      `ffmpeg -y -i ${videoPath} -vn -ar 16000 -ac 1 -f mp3 ${audioPath}`,
    )

    res.setHeader("Content-Type", "audio/mpeg")
    fs.createReadStream(audioPath).pipe(res)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: error.message || "Error",
      stack: error.stack,
    })
  }
})

/**
 * 📝 /captions?url=...&format=srt|json|text
 * Transcribes audio and returns a subtitle file
 */
app.post("/captions", async (req, res) => {
  const videoUrl = req.body.url
  const requestedFormat = req.body.format
  const format = requestedFormat === "json" ? "verbose_json" : "srt"
  const cleaningPrompt = req.body.cleaning_prompt

  if (!videoUrl) return res.status(400).send("Missing url")

  const videoPath = path.join(tmp, "input.mp4")
  const audioPath = path.join(tmp, "output.mp3")

  try {
    const response = await axios.get(videoUrl, { responseType: "stream" })
    const writer = fs.createWriteStream(videoPath)
    await new Promise((resolve, reject) => {
      response.data.pipe(writer)
      writer.on("finish", resolve)
      writer.on("error", reject)
    })

    execSync(
      `ffmpeg -y -i ${videoPath} -vn -ar 16000 -ac 1 -f mp3 ${audioPath}`,
    )

    let transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      response_format: format,
    })

    if (cleaningPrompt) {
      const basePrompt =
        "You are a subtitle cleaning assistant. Your job is to clean and improve subtitles, strictly respecting the original subtitle format (SRT or JSON), but applying the following user rules:"
      const fullPrompt = `${basePrompt}\n${cleaningPrompt}`
      let transcriptText = transcript
      if (format === "verbose_json" && transcript.text) {
        transcriptText = transcript.text
      }
      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: fullPrompt },
          { role: "user", content: transcriptText },
        ],
      })
      transcript = gptResponse.choices[0].message.content
    }

    res.setHeader(
      "Content-Type",
      format === "verbose_json" ? "application/json" : "text/plain",
    )
    res.send(transcript)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: error.message || "Error",
      stack: error.stack,
    })
  }
})

/**
 * 📝 /captions-word-by-word
 * Transcribes audio word by word using Deepgram API
 */
app.post("/captions-word-by-word", async (req, res) => {
  const audioUrl = req.body.url
  if (!audioUrl) return res.status(400).send("Missing url")

  try {
    const response = await axios.post(
      "https://api.deepgram.com/v1/listen?language=en&model=nova-3",
      { url: audioUrl },
      {
        headers: {
          Authorization: "Token 955ff624d0af44bf5ef57c78cf15448422c5d32a",
          "Content-Type": "application/json",
        },
      },
    )
    res.setHeader("Content-Type", "application/json")
    res.send(response.data)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: error.message || "Error",
      stack: error.stack,
    })
  }
})

/**
 * ⏱️ /duration
 * Calcule la durée d'une vidéo (en secondes)
 */
app.post("/duration", async (req, res) => {
  const videoUrl = req.body.url
  if (!videoUrl) return res.status(400).send("Missing url")

  const videoPath = path.join(tmp, "input.mp4")

  try {
    const response = await axios.get(videoUrl, { responseType: "stream" })
    const writer = fs.createWriteStream(videoPath)
    await new Promise((resolve, reject) => {
      response.data.pipe(writer)
      writer.on("finish", resolve)
      writer.on("error", reject)
    })

    const ffprobeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${videoPath}`
    const durationStr = execSync(ffprobeCmd).toString().trim()
    const duration = parseFloat(durationStr)

    res.json({ duration })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: error.message || "Error",
      stack: error.stack,
    })
  }
})

app.listen(port, () => {
  console.log(`🚀 extract-and-caption running on port ${port}`)
})
