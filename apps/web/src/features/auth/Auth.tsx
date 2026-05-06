import { useState } from 'react'
import { supabase } from '@/lib/sync/supabase'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'

interface AuthProps {
  defaultMode?: 'login' | 'signup'
}

export function Auth({ defaultMode = 'login' }: AuthProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = mode === 'login' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else if (mode === 'signup') {
      setMessage({ type: 'success', text: 'Check your email for the confirmation link!' })
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/50 p-4 relative">
      <button 
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' 
              ? 'Enter your credentials to access your research' 
              : 'Sign up to start organizing your insights'}
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              message.type === 'success' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAuth} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 text-lg">
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t pt-6">
          <div className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <Link
              to={mode === 'login' ? '/signup' : '/login'}
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="ml-1 text-primary font-semibold hover:underline"
            >
              {mode === 'login' ? 'Sign Up' : 'Log In'}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
