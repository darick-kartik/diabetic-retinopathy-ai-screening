import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Activity, Check, Eye, EyeOff, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/shared/PageContainer'
import { useAuth } from '@/contexts/AuthContext'

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(150, 'Name must be 150 characters or fewer.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(128, 'Password must be 128 characters or fewer.'),
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' })

export function RegisterPage() {
  const { user, register: createAccount } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' }, mode: 'onChange', reValidateMode: 'onChange' })
  const password = form.watch('password')
  const confirmPassword = form.watch('confirmPassword')
  const passwordsMatch = Boolean(password && confirmPassword && password === confirmPassword)
  const showPasswordMismatch = Boolean(confirmPassword && !passwordsMatch)
  const strength = useMemo(() => [password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length, [password])
  if (user) return <Navigate to={`/portal/${user.role.toLowerCase()}`} replace />
  const submit = form.handleSubmit(async ({ confirmPassword, ...values }) => {
    setSubmitError('')
    try { await createAccount(values); navigate('/login', { replace: true, state: { registered: true } }) }
    catch (error) { setSubmitError(error.message) }
  })
  const fieldClass = 'mt-1.5 h-11 w-full rounded-control border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
  return <PageContainer className="grid min-h-[calc(100vh-132px)] place-items-center py-12"><Card className="w-full max-w-2xl border-slate-200"><CardHeader className="items-center text-center"><span className="mb-2 grid h-12 w-12 place-items-center rounded-card bg-teal text-white"><Activity /></span><CardTitle className="text-2xl text-navy">Create a patient account</CardTitle><p className="pt-2 text-sm text-slate-600">Registration is for patient accounts only. Doctor and admin accounts are never self-registered.</p></CardHeader><CardContent>
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700">Full name<input autoComplete="name" {...form.register('fullName')} className={fieldClass} />{form.formState.errors.fullName && <small className="text-rose-700">{form.formState.errors.fullName.message}</small>}</label>
      <label className="text-sm font-semibold text-slate-700">Email<input type="email" autoComplete="email" {...form.register('email')} className={fieldClass} />{form.formState.errors.email && <small className="text-rose-700">{form.formState.errors.email.message}</small>}</label>
      <label className="text-sm font-semibold text-slate-700">Password<span className="relative mt-1.5 block"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...form.register('password')} className={`${fieldClass} pr-11`} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-2 rounded p-1.5 text-slate-500 focus-visible:ring-2 focus-visible:ring-teal" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span><span className="mt-2 flex gap-1" aria-label={`Password strength ${strength} out of 5`}>{[1, 2, 3, 4, 5].map((level) => <i key={level} className={`h-1.5 flex-1 rounded-pill ${level <= strength ? strength < 3 ? 'bg-rose-500' : strength < 5 ? 'bg-amber-500' : 'bg-emerald-600' : 'bg-slate-200'}`} />)}</span>{form.formState.errors.password && <small className="text-rose-700">{form.formState.errors.password.message}</small>}</label>
      <label className="text-sm font-semibold text-slate-700">Confirm password<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" aria-invalid={showPasswordMismatch || undefined} aria-describedby="confirm-password-status" {...form.register('confirmPassword')} className={`${fieldClass} ${passwordsMatch ? 'border-emerald-600 focus-visible:ring-emerald-600' : showPasswordMismatch ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`} />
        <span id="confirm-password-status" role="status" aria-live="polite" className={`mt-1.5 flex min-h-5 items-center gap-1.5 text-xs ${passwordsMatch ? 'text-emerald-700' : showPasswordMismatch ? 'text-rose-700' : 'text-slate-500'}`}>
          {passwordsMatch ? <><Check size={14} aria-hidden="true" /> Passwords match (case-sensitive).</> : showPasswordMismatch ? <><X size={14} aria-hidden="true" /> Passwords do not match. Check uppercase and lowercase letters.</> : 'Re-enter your password; matching is case-sensitive.'}
        </span>
        {form.formState.errors.confirmPassword && <small className="text-rose-700">{form.formState.errors.confirmPassword.message}</small>}
      </label>
      {submitError && <p role="alert" className="sm:col-span-2 rounded-control bg-rose-50 p-3 text-sm text-rose-800">{submitError}</p>}
      <div className="sm:col-span-2"><Button className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Creating account…' : 'Create patient account'}</Button><p className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} className="text-teal" />The registration request is sent to FastAPI. Passwords are not retained by this frontend.</p></div>
    </form><p className="mt-5 text-center text-sm text-slate-600">Already have an account? <Link to="/login" className="font-semibold text-teal">Sign in</Link></p>
  </CardContent></Card></PageContainer>
}
