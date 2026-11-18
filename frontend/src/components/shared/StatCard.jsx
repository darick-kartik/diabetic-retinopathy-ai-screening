import { Card, CardContent } from '@/components/ui/card'

export function StatCard({ label, value, icon: Icon, detail }) {
  return <Card className="border-slate-200 shadow-none"><CardContent className="flex items-start justify-between gap-3 p-5"><div><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-navy">{value}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</div>{Icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-teal-50 text-teal"><Icon size={19} /></span>}</CardContent></Card>
}
