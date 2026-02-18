import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LoginForm } from "@/components/login-form"

export const metadata = {
  title: "Operations Login",
}

export default function OperationLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <LoginForm loginType="operation" />
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Back to Login Options
          </Button>
        </Link>
      </div>
    </div>
  )
}
