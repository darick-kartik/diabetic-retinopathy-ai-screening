import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const publicLinks = [['/about', 'About'], ['/how-it-works', 'How it works'], ['/grades', 'DR grades'], ['/help', 'Help']]

export function PublicLayout() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const dashboardPath = user ? `/portal/${user.role.toLowerCase()}` : '/login'
  const endSession = () => { logout(); navigate('/') }

  return <div className="min-h-screen bg-white text-foreground">
    <header className="sticky top-0 z-30 border-b border-white/10 bg-navy text-white shadow-sm">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-page-x">
        <Link to="/" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="RetinaCare home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal text-white"><Activity size={21} strokeWidth={2.5} /></span>
          <span><span className="block text-base font-bold tracking-tight text-white">RetinaCare</span><span className="block text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-300">AI diabetic retinopathy screening</span></span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-200 md:flex" aria-label="Main navigation">{publicLinks.map(([href, label]) => <Link key={href} to={href} className="transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{label}</Link>)}</nav>
        <div className="hidden items-center gap-3 sm:flex">{user ? <><Link to={dashboardPath} className="rounded-md px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">Open workspace <ArrowRight className="ml-1 inline" size={15} /></Link><button onClick={endSession} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white">Sign out</button></> : <><Link to="/login" className="rounded-md px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">Log in</Link><Link to="/register" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal/90">Get started <ArrowRight size={16} /></Link></>}</div>
        <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} className="rounded-md p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden">{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      {mobileOpen && <nav className="border-t border-white/10 bg-navy px-page-x py-3 md:hidden" aria-label="Mobile navigation">{publicLinks.map(([href, label]) => <Link key={href} to={href} onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2.5 text-sm font-medium text-slate-100 hover:bg-white/10">{label}</Link>)}<Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="mt-2 block rounded-md bg-teal px-3 py-2.5 text-sm font-semibold text-white">{user ? 'Open workspace' : 'Log in or register'}</Link></nav>}
    </header>
    <Outlet />
    <footer className="border-t border-slate-100 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-page-x py-7 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} RetinaCare · Academic research prototype</span><div className="flex flex-wrap gap-4"><Link to="/privacy" className="hover:text-navy">Privacy</Link><Link to="/disclaimer" className="hover:text-navy">Medical disclaimer</Link><Link to="/help" className="hover:text-navy">Help</Link></div></div><p className="mx-auto max-w-7xl px-page-x pb-6 text-xs leading-5 text-slate-500">Research prototype only. Model outputs are not a diagnosis, treatment recommendation or prescription.</p></footer>
  </div>
}
