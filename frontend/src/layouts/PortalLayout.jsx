import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Activity, Bell, ChevronDown, CircleHelp, ClipboardCheck, FileClock, Files, Gauge, GitCompareArrows, HeartPulse, LayoutDashboard, LogOut, Menu, MessageCircleQuestion, Settings, ShieldCheck, Users, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePortalQuery } from '@/hooks/usePortalQuery'
import { service } from '@/services'
import { useQueryClient } from '@tanstack/react-query'

const navItems = {
  PATIENT: [
    { to: '/portal/patient', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/portal/patient/history', label: 'Screening history', icon: FileClock },
    { to: '/portal/patient/upload', label: 'New screening', icon: Activity },
    { to: '/portal/patient/compare', label: 'Compare records', icon: GitCompareArrows },
    { to: '/portal/patient/record-answers', label: 'Ask about my records', icon: MessageCircleQuestion },
    { to: '/portal/patient/recommendations', label: 'Care education', icon: HeartPulse },
    { to: '/portal/patient/reports', label: 'Reports', icon: Files },
    { to: '/portal/patient/notifications', label: 'Notifications', icon: Bell },
    { to: '/portal/patient/profile', label: 'Profile & medical record', icon: Settings },
    { to: '/portal/patient/treatment-plans', label: 'Doctor-issued plans', icon: ShieldCheck },
    { to: '/help', label: 'Help & information', icon: CircleHelp },
  ],
  DOCTOR: [
    { to: '/portal/doctor', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/portal/doctor/reviews', label: 'Review queue', icon: ClipboardCheck },
    { to: '/portal/doctor/patients', label: 'Patient directory', icon: Users },
    { to: '/portal/doctor/compare', label: 'Compare records', icon: GitCompareArrows },
    { to: '/portal/doctor/treatment', label: 'Treatment plans', icon: ShieldCheck },
    { to: '/portal/doctor/reports', label: 'Report previews', icon: Files },
    { to: '/portal/doctor/notifications', label: 'Notifications', icon: Bell },
  ],
  ADMIN: [
    { to: '/portal/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/portal/admin/users', label: 'User management', icon: Users },
    { to: '/portal/admin/activity', label: 'System activity', icon: FileClock },
    { to: '/portal/admin/model', label: 'Model information', icon: Gauge },
    { to: '/portal/admin/notifications', label: 'Notifications', icon: Bell },
  ],
}

export function PortalLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const notificationQuery = usePortalQuery('notifications', (account) => service.getNotifications(account), { enabled: notificationOpen })
  const queryClient = useQueryClient()
  const items = navItems[user?.role] || []
  const roleName = { PATIENT: 'Patient workspace', DOCTOR: 'Doctor portal', ADMIN: 'Admin portal' }[user?.role]

  useEffect(() => {
    if (!mobileOpen) return undefined
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileOpen])

  const endSession = () => {
    logout()
    navigate('/')
  }

  const nav = <nav aria-label="Workspace navigation" className="space-y-1">
    {items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><Icon size={17} aria-hidden="true" />{label}</NavLink>)}
  </nav>

  return <div className="min-h-screen bg-slate-50">
    <div className="flex min-h-[calc(100vh-33px)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy px-4 py-5 text-white lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-3 px-2" aria-label="RetinaCare home"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal"><Activity size={21} /></span><span><span className="block font-bold tracking-tight">RetinaCare</span><span className="text-[10px] uppercase tracking-wider text-slate-300">{roleName}</span></span></Link>
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</p>
        {nav}
        <div className="mt-auto rounded-control border border-white/10 bg-white/5 p-3"><p className="text-xs font-semibold">Research prototype</p><p className="mt-1 text-[11px] leading-5 text-slate-300">Screening support only. Not a diagnosis.</p><Link to="/disclaimer" className="mt-2 inline-block text-xs font-semibold text-teal-200 hover:text-white">Read disclaimer</Link></div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-page-x">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMobileOpen(true)} className="rounded-control p-2 text-navy hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal lg:hidden" aria-label="Open workspace navigation"><Menu size={20} /></button>
              <Link to="/" className="flex items-center gap-2 font-bold text-navy lg:hidden"><Activity className="text-teal" size={20} /> RetinaCare</Link>
              <p className="hidden text-sm font-semibold text-slate-500 lg:block">{roleName}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative"><button type="button" onClick={() => setNotificationOpen((open) => !open)} aria-label="Open notifications" aria-expanded={notificationOpen} className="relative rounded-control p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"><Bell size={18} />{notificationQuery.data?.some((item) => !item.read) && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-teal ring-2 ring-white" />}</button>{notificationOpen && <div className="absolute right-0 top-12 z-50 w-[min(22rem,90vw)] rounded-card border border-slate-200 bg-white p-3 shadow-soft"><div className="flex items-center justify-between"><p className="text-sm font-bold text-navy">Notifications</p><Link to={`/portal/${user?.role?.toLowerCase()}/notifications`} onClick={() => setNotificationOpen(false)} className="text-xs font-semibold text-teal">View all</Link></div>{notificationQuery.isLoading ? <p className="py-5 text-center text-xs text-slate-500">Loading…</p> : notificationQuery.isError ? <p className="py-4 text-xs leading-5 text-amber-900">{notificationQuery.error.message}</p> : notificationQuery.data?.length ? <div className="mt-2 divide-y divide-slate-100">{notificationQuery.data.slice(0, 4).map((notice) => <div key={notice.id} className="py-2.5"><p className="text-xs font-semibold text-navy">{notice.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{notice.body}</p>{!notice.read && <button onClick={async () => { await service.markNotificationRead(user, notice.id); await queryClient.invalidateQueries({ queryKey: ['notifications', user.id] }) }} className="mt-1 text-[11px] font-semibold text-teal hover:underline">Mark read</button>}</div>)}</div> : <p className="py-5 text-center text-xs text-slate-500">No notifications yet.</p>}</div>}</div>
              <div className="relative">
                <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} className="flex items-center gap-2 rounded-control px-2 py-1.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"><span className="grid h-8 w-8 place-items-center rounded-full bg-teal-50 text-xs font-bold text-teal">{user?.fullName?.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span className="hidden max-w-36 truncate text-left text-xs font-semibold text-navy sm:block">{user?.fullName}</span><ChevronDown size={14} className="text-slate-500" /></button>
                {menuOpen && <div className="absolute right-0 top-12 w-52 rounded-card border border-slate-200 bg-white p-1.5 shadow-soft"><p className="px-3 py-2 text-xs text-slate-500">{user?.role} · Authenticated account</p>{user?.role === 'PATIENT' && <Link to="/portal/patient/profile" onClick={() => setMenuOpen(false)} className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Profile & settings</Link>}<button onClick={endSession} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"><LogOut size={15} /> Sign out</button></div>}
              </div>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto whitespace-nowrap px-page-x pb-1 lg:hidden">{navItems[user?.role]?.slice(0, 5).map(({ to, label, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `inline-flex px-3 py-2 text-xs font-semibold ${isActive ? 'border-b-2 border-teal text-teal' : 'text-slate-600'}`}>{label}</NavLink>)}</div>
        </header>
        <main className="w-full flex-1">{user?.isDemo && <div role="status" className="mx-page-x mt-4 rounded-control border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"><strong>DEMO MODE — SYNTHETIC DATA.</strong> This sample patient and all screening grades are fictional demonstrations, not real records or AI predictions. Uploads and inference are disabled.</div>}<Outlet /></main>
        <footer className="border-t border-slate-200 bg-white px-page-x py-4 text-xs text-slate-500">{user?.isDemo ? 'Demo workspace with synthetic data only. No patient records or AI inference are connected.' : 'RetinaCare is a research prototype. Record data and model outputs come from the configured FastAPI service.'}</footer>
      </div>
    </div>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Workspace navigation"><button type="button" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-navy/50" aria-label="Close navigation overlay" /><aside className="absolute inset-y-0 left-0 w-[min(20rem,85vw)] overflow-y-auto bg-navy p-4 text-white"><div className="mb-8 flex items-center justify-between"><span className="flex items-center gap-2 font-bold"><Activity className="text-teal" /> RetinaCare</span><button onClick={() => setMobileOpen(false)} className="rounded p-2 hover:bg-white/10" aria-label="Close navigation"><X /></button></div>{nav}</aside></div>}
  </div>
}

export function PatientPortalLayout() { return <PortalLayout /> }
export function DoctorPortalLayout() { return <PortalLayout /> }
export function AdminPortalLayout() { return <PortalLayout /> }
