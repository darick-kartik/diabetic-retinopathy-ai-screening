import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { gradeBadgeClass, gradeFor } from '@/constants/screening'
import { StatusBadge } from '@/components/shared/StatusBadge'

export function ScreeningTable({ records = [], basePath = '/portal/patient/screenings' }) {
  if (!records.length) return <p className="py-8 text-center text-sm text-slate-500">No screening records match this view.</p>
  return <div className="overflow-x-auto"><table className="w-full min-w-[650px] border-collapse text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="px-4 py-3 font-semibold">Screening</th><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Eye</th><th className="px-4 py-3 font-semibold">Recorded grade</th><th className="px-4 py-3 font-semibold">Review</th><th className="px-4 py-3" /></tr></thead><tbody>{records.map((record) => {
    const grade = gradeFor(record.grade)
    return <tr key={record.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
      <td className="px-4 py-3.5 font-semibold text-navy">{record.id.slice(-12)}</td><td className="px-4 py-3.5 text-slate-600">{new Date(record.date).toLocaleDateString()}</td><td className="px-4 py-3.5 text-slate-600">{record.eyeSide || 'Unknown'}</td><td className="px-4 py-3.5">{grade ? <span className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${gradeBadgeClass(grade.grade)}`}>{grade.short}</span> : <span className="text-slate-500">{record.predictionPending ? 'Not requested' : 'No grade returned'}</span>}</td><td className="px-4 py-3.5">{record.reviewStatus ? <StatusBadge tone={record.reviewStatus === 'REVIEWED' ? 'green' : 'amber'}>{record.reviewStatus}</StatusBadge> : <span className="text-slate-500">Not available</span>}</td><td className="px-4 py-3.5 text-right"><Link className="inline-flex items-center gap-1 font-semibold text-teal hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal" to={`${basePath}/${record.id}`}>Open <ArrowUpRight size={14} /></Link></td>
    </tr>
  })}</tbody></table></div>
}
