import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function StateView({ title, message, kind = 'empty', action, onAction }) {
  const Icon = kind === 'error' ? AlertCircle : Inbox
  return <Card className="border-slate-200 shadow-none"><CardContent className="flex flex-col items-center px-6 py-12 text-center">
    <span className={`grid h-12 w-12 place-items-center rounded-full ${kind === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'}`}><Icon size={22} /></span>
    <h2 className="mt-4 text-lg font-semibold text-navy">{title}</h2>
    <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{message}</p>
    {action && <Button className="mt-5" variant="outline" onClick={onAction}>{kind === 'error' && <RefreshCw size={15} />}{action}</Button>}
  </CardContent></Card>
}
