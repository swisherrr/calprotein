import { Button } from "@/components/ui/button"

export function LoginForm() {
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-gray-500 dark:text-gray-400">Enter your credentials to sign in</p>
      </div>
      
      <form className="space-y-4">
        <div className="space-y-2">
          <label 
            htmlFor="email"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="johndoe@example.com"
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-gray-600"
          />
        </div>
        
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-gray-600"
          />
        </div>

        <Button className="w-full">Sign in</Button>
      </form>

      <div className="text-center text-sm">
        Don't have an account?{" "}
        <a className="underline underline-offset-4 hover:text-gray-600" href="#">
          Sign up
        </a>
      </div>
    </div>
  )
} 