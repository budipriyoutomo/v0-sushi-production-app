import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AdminRoleLogin } from "@/components/admin-role-login"

export const metadata = {
  title: "Admin Login",
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <AdminRoleLogin />
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Back to Login Options
          </Button>
        </Link>
      </div>
    </div>
  )
}
