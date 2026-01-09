import { LoginForm } from "@/components/login-form"

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <LoginForm loginType="admin" />
    </div>
  )
}
