import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Bell, CalendarDays, FileClock, GitCompareArrows, Plus, UserRound } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageHeading } from '@/components/shared/PageHeading'
import { StatCard } from '@/components/shared/StatCard'
import { ScreeningTable } from '@/components/shared/ScreeningTable'
import { StateView } from '@/components/shared/StateView'
import { Loading } from '@/components/shared/Loading'
import { usePortalQuery } from '@/hooks/usePortalQuery'
import { service } from '@/services'
import { gradeFor } from '@/constants/screening'
import { StatusBadge } from '@/components/shared/StatusBadge'

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = usePortalQuery('patient-dashboard', (user, signal) => service.getDashboard(user, signal))
  if (isLoading) return <PageContainer><Loading label="Loading your workspace" /></PageContainer>
  if (isError) return <PageContainer><StateView title="Dashboard could not load" message={error.message} kind="error" action="Try again" onAction={refetch} /></PageContainer>

  const currentGrade = gradeFor(data.lastScreening?.grade)
  const chartData = (data.gradeHistory || []).map((record) => ({ date: new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), grade: record.grade, label: gradeFor(record.grade)?.short || 'Pending' }))

  return <PageContainer>
    <PageHeading eyebrow="Patient workspace" title={`Welcome, ${data.patient.fullName.split(' ')[0]}`} description="A private overview of your retinal screening records and account." action={<Link to="/portal/patient/upload" className="inline-flex h-10 items-center gap-2 rounded-control bg-teal px-4 text-sm font-semibold text-white hover:bg-teal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"><Plus size={17} /> New screening</Link>} />
    <div className="mb-5 rounded-control border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"><strong>Research-only notice:</strong> Screening records and charts are for review support, not diagnosis or treatment decisions.</div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Recorded screenings" value={data.totalScreenings} icon={Activity} detail="All dates in this account" />
      <StatCard label="Latest screening" value={data.lastScreening ? new Date(data.lastScreening.date).toLocaleDateString() : '—'} icon={CalendarDays} detail={data.lastScreening?.eyeSide || 'No record yet'} />
      <StatCard label="Latest model category" value={currentGrade?.short || 'No prediction'} icon={FileClock} detail="Research output · not a diagnosis" />
      <StatCard label="Notifications" value="Unavailable" icon={Bell} detail="No notifications endpoint is available" />
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
      <Card className="border-slate-200 shadow-none"><CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-base text-navy">Screening activity</CardTitle><p className="mt-1 text-xs text-slate-500">Recorded model grades by date · not a clinical progression measure</p></div><Link to="/portal/patient/history" className="text-xs font-semibold text-teal hover:underline">Full history <ArrowRight className="ml-1 inline" size={13} /></Link></CardHeader><CardContent>
        {chartData.length > 1 ? <div className="h-64 w-full" aria-label="Line chart of recorded screening model grades"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 12, right: 15, bottom: 4, left: -20 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} /><YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 11, fill: '#64748b' }} /><Tooltip formatter={(value, name, item) => [item.payload.label, 'Recorded grade']} /><Line type="monotone" dataKey="grade" stroke="#0D9488" strokeWidth={2.5} dot={{ r: 4, fill: '#0D9488' }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div> : <div className="grid h-56 place-items-center text-sm text-slate-500">{chartData.length === 1 ? 'A second completed screening is needed to plot a timeline.' : 'A timeline appears when completed prediction records are available.'}</div>}
      </CardContent></Card>
      <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-base text-navy">Care team discussion</CardTitle></CardHeader><CardContent><div className="rounded-control bg-clinic p-4"><p className="text-sm font-semibold text-navy">Review results with a qualified professional</p><p className="mt-2 text-sm leading-6 text-slate-700">This research system does not provide clinical follow-up recommendations. For questions about your eye health, contact your eye-care professional.</p></div><div className="mt-4 grid grid-cols-2 gap-2"><Link to="/portal/patient/history" className="flex items-center justify-center gap-2 rounded-control border border-slate-200 px-3 py-2.5 text-xs font-semibold text-navy hover:bg-slate-50"><FileClock size={15} /> View history</Link><Link to="/portal/patient/compare" className="flex items-center justify-center gap-2 rounded-control border border-slate-200 px-3 py-2.5 text-xs font-semibold text-navy hover:bg-slate-50"><GitCompareArrows size={15} /> Compare records</Link></div><Link to="/portal/patient/profile" className="mt-4 flex items-center gap-3 rounded-control p-2 hover:bg-slate-50"><span className="grid h-9 w-9 place-items-center rounded-full bg-teal-50 text-teal"><UserRound size={17} /></span><span className="min-w-0"><span className="block text-xs font-semibold text-navy">{data.patient.fullName}</span><span className="block truncate text-[11px] text-slate-500">{data.patient.patientCode} · Patient profile</span></span><ArrowRight className="ml-auto text-slate-400" size={15} /></Link></CardContent></Card>
    </div>
    <Card className="mt-5 border-slate-200 shadow-none"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base text-navy">Recent screening records</CardTitle><StatusBadge tone="blue">Your records</StatusBadge></CardHeader><CardContent className="pt-0"><ScreeningTable records={data.recentScreenings} /></CardContent></Card>
  </PageContainer>
}
