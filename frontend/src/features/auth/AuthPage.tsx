import * as React from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, KeyRound, Lock, Mail, User as UserIcon } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, register } = useAuth()

  const initialTab = searchParams.get('mode') === 'register' ? 'register' : 'login'
  const [activeTab, setActiveTab] = React.useState<string>(initialTab)

  // Login form state
  const [loginEmail, setLoginEmail] = React.useState('arpan@effectivelearn.dev')
  const [loginPassword, setLoginPassword] = React.useState('••••••••••••')
  const [isLoggingIn, setIsLoggingIn] = React.useState(false)

  // Register form state
  const [regName, setRegName] = React.useState('')
  const [regEmail, setRegEmail] = React.useState('')
  const [regPassword, setRegPassword] = React.useState('')
  const [isRegistering, setIsRegistering] = React.useState(false)

  React.useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setActiveTab('register')
    } else if (searchParams.get('mode') === 'login') {
      setActiveTab('login')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail.trim()) {
      toast.error('Please enter your email address')
      return
    }

    try {
      setIsLoggingIn(true)
      await login(loginEmail, loginPassword)
      toast.success('Welcome back to EffectiveLearn!')
      navigate('/')
    } catch {
      toast.error('Failed to sign in. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName.trim() || !regEmail.trim()) {
      toast.error('Please fill in your name and email')
      return
    }

    try {
      setIsRegistering(true)
      await register(regName, regEmail, regPassword)
      toast.success('Account created successfully! Welcome aboard.')
      navigate('/')
    } catch {
      toast.error('Registration failed. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-10 px-4">
      {/* Back button */}
      <div className="w-full max-w-md mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to EffectiveLearn
        </Link>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-xl shadow-md">
            E
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Effective<span className="font-normal text-slate-500 dark:text-slate-400">Learn</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your personal learning journal, architecture notes & embedded lectures
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-[#11131a]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* LOGIN TAB */}
            <TabsContent value="login" className="m-0">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@domain.com"
                        className="pl-9"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <button
                        type="button"
                        onClick={() => toast.info('Password reset is mocked for frontend demo.')}
                        className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••••••"
                        className="pl-9"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                  <Button type="submit" className="w-full" disabled={isLoggingIn}>
                    {isLoggingIn ? 'Signing in...' : 'Sign In to Your Workspace'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-xs text-slate-600 dark:text-slate-300"
                    onClick={() => {
                      setLoginEmail('arpan@effectivelearn.dev')
                      setLoginPassword('demo-architect')
                      toast.info('Loaded demo credentials for Arpan Parajuli')
                    }}
                  >
                    <KeyRound className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
                    Fill Demo Credentials
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* REGISTER TAB */}
            <TabsContent value="register" className="m-0">
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="e.g. Arpan Parajuli"
                        className="pl-9"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="you@domain.com"
                        className="pl-9"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="Create a secure password"
                        className="pl-9"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                  <Button type="submit" className="w-full" disabled={isRegistering}>
                    {isRegistering ? 'Creating Account...' : 'Create Free Account'}
                  </Button>

                  <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                    By signing up, you get offline caching and synchronized notes.
                  </p>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
