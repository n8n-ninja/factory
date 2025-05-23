import React from "react"
import { titleThemes } from "../styles/title-themes"
import { LetterAnimation } from "./LetterAnimation"
import { TitleLayerType } from "@/schemas/project"
import { parseStyleString } from "@/utils/getStyle"
import { titleBaseStyle } from "@/styles/default-style"
import { useTheme } from "../contexts/ThemeContext"

/**
 * Title: renders a single title with theme and animation.
 *
 * @param title The title object to render (TitleType).
 * @param revealProgress The reveal progress of the title (number, optional, default 1).
 * @returns A styled h1 element with optional letter animation.
 */
export const Title: React.FC<{
  title: TitleLayerType
  revealProgress?: number
}> = ({ title, revealProgress = 1 }) => {
  const theme = useTheme()
  const themeStyle =
    title.theme && titleThemes[title.theme] ? titleThemes[title.theme] : {}
  const titleStyle = title.style ? parseStyleString(title.style) : {}
  const style = {
    ...titleBaseStyle,
    ...theme.title?.style,
    ...themeStyle,
    ...titleStyle,
  }
  let letterAnimationConfig = null
  if (title.letterAnimation) {
    const config = title.letterAnimation
    letterAnimationConfig = {
      duration: config.duration ?? 0.3,
      easing: config.easing ?? "easeOut",
      stagger: config.stagger ?? 0.05,
      translateY: config.translateY ?? 20,
    }
  }

  return (
    <h1 style={style}>
      {letterAnimationConfig ? (
        <LetterAnimation
          text={title.title || ""}
          config={letterAnimationConfig}
        />
      ) : (
        title.title
      )}
    </h1>
  )
}
