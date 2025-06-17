import { LoginForm } from "@/components/auth/login-form"
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <LoginForm />
    </div>
  )
} 