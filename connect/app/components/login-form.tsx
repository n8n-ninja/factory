// app/components/login-form.tsx

import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useState } from "react"
import { supabase } from "~/lib/supabase.client"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setMessage("")

    try {
      // Send OTP but specify not to create a new user
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
          shouldCreateUser: false, // Prevent creating new users
        },
      })

      if (error) {
        // When shouldCreateUser is false and user doesn't exist,
        // Supabase returns an error with message containing "user not found"
        if (error.message.toLowerCase().includes("user not found")) {
          setMessage("No account exists with this email address")
        } else {
          setMessage(error.message)
        }
      } else {
        setMessage("Check your email for confirmation link!")
      }
    } catch (error: unknown) {
      setMessage("An error occurred. Please try again.")
      console.error(error)
    }

    setIsLoading(false)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Connect to your engine</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    "Login"
                  )}
                </Button>

                <div className="h-8">
                  {message && (
                    <p
                      className={cn(
                        "text-sm text-center",
                        message.includes("error") ||
                          message.includes("No account")
                          ? "text-red-500"
                          : "text-green-500"
                      )}
                    >
                      {message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
