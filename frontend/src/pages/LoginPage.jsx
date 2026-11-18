import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Activity, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/shared/PageContainer'
import { useAuth } from '@/contexts/AuthContext'
import { DEMO_CREDENTIALS } from '@/services/demo/service'

const schema = z.object({ email: z.string().email('Enter a valid email address.'), password: z.string().min(1, 'Enter your password.') })

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [demoLoading, setDemoLoading] = useState(false)
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })
  if (user) return <Navigate to={location.state?.from || `/portal/${user.role.toLowerCase()}`} replace />
  const submit = form.handleSubmit(async (credentials) => {
    setSubmitError('')
    try {
      const signedIn = await login(credentials)
      navigate(location.state?.from || `/portal/${signedIn.role.toLowerCase()}`, { replace: true })
    } catch (error) { setSubmitError(error.message) }
  })
  const enterDemo = async () => {
    setSubmitError('')
    setDemoLoading(true)
    try {
      const signedIn = await login(DEMO_CREDENTIALS)
      navigate(location.state?.from || `/portal/${signedIn.role.toLowerCase()}`, { replace: true })
    } catch (error) { setSubmitError(error.message) }
    finally { setDemoLoading(false) }
  }
  const fieldClass = 'mt-1.5 h-11 w-full rounded-control border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return <PageContainer className="grid min-h-[calc(100vh-132px)] place-items-center py-12"><Card className="w-full max-w-2xl border-slate-200"><CardHeader className="items-center text-center"><span className="mb-2 grid h-12 w-12 place-items-center rounded-card bg-teal text-white"><Activity /></span><CardTitle className="text-2xl text-navy">Sign in to RetinaCare</CardTitle><p className="pt-2 text-sm text-slate-600">Access your screening workspace.</p></CardHeader><CardContent>
    <div className="mb-5 rounded-control border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">Sign in with your FastAPI account, or use the local demo below. The demo works without a database and contains synthetic sample records only.</div>
    {location.state?.registered && <p role="status" className="mb-4 rounded-control bg-emerald-50 p-3 text-sm text-emerald-900">Your account was created. Sign in with your new credentials.</p>}<form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold text-slate-700">Email address<input type="email" autoComplete="username" {...form.register('email')} className={fieldClass} placeholder="you@example.org" />{form.formState.errors.email && <small role="alert" className="mt-1 block text-rose-700">{form.formState.errors.email.message}</small>}</label><label className="block text-sm font-semibold text-slate-700">Password<span className="relative mt-1.5 block"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" {...form.register('password')} className={`${fieldClass} pr-11`} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword((show) => !show)} className="absolute right-2 top-2 rounded p-1.5 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>{form.formState.errors.password && <small role="alert" className="mt-1 block text-rose-700">{form.formState.errors.password.message}</small>}</label><div className="flex items-center justify-end"><Link to="/forgot-password" className="text-xs font-semibold text-teal hover:underline">Password recovery information</Link></div>{submitError && <p role="alert" className="rounded-control bg-rose-50 p-3 text-sm text-rose-800">{submitError}</p>}<Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Signing in…' : 'Sign in securely'}</Button><p className="flex items-start gap-2 text-[11px] leading-5 text-slate-500"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-teal" />Your JWT is held in sessionStorage for this browser session and is never written to localStorage.</p></form>
    <div className="mt-6 rounded-card border border-teal/20 bg-teal-50/70 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-navy">Explore with a demo account</p><p className="mt-1 text-xs leading-5 text-slate-600">Synthetic data only. Uploads and real AI inference are disabled.</p><p className="mt-2 font-mono text-xs text-slate-700">{DEMO_CREDENTIALS.email}<br />{DEMO_CREDENTIALS.password}</p></div><Button type="button" variant="outline" disabled={demoLoading || form.formState.isSubmitting} onClick={enterDemo}>{demoLoading ? 'Opening demo…' : 'Enter demo workspace'}</Button></div></div>
    <p className="mt-5 text-center text-sm text-slate-600">New to RetinaCare? <Link className="font-semibold text-teal hover:underline" to="/register">Create a patient account</Link></p>
  </CardContent></Card></PageContainer>
}

export function ForgotPasswordPage() {
  return <PageContainer className="grid min-h-[calc(100vh-132px)] place-items-center py-12"><Card className="w-full max-w-md"><CardHeader><CardTitle className="text-xl text-navy">Password recovery</CardTitle><p className="text-sm leading-6 text-slate-600">Password recovery is not available in the current FastAPI backend. Contact your system administrator for account support.</p></CardHeader><CardContent><Link to="/login" className="inline-flex h-10 items-center justify-center rounded-control bg-teal px-4 text-sm font-semibold text-white">Return to sign in</Link></CardContent></Card></PageContainer>
}

export function ResetPasswordPage() {
  return <PageContainer className="grid min-h-[calc(100vh-132px)] place-items-center py-12"><Card className="w-full max-w-md"><CardHeader><CardTitle className="text-xl text-navy">Password reset unavailable</CardTitle><p className="text-sm leading-6 text-slate-600">The backend does not provide a reset code or password reset endpoint. No reset action has been simulated.</p></CardHeader><CardContent><Link to="/login" className="inline-flex h-10 items-center justify-center rounded-control bg-teal px-4 text-sm font-semibold text-white">Return to sign in</Link></CardContent></Card></PageContainer>
}
