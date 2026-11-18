import { AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function ErrorDisplay({ title = 'Something went wrong', message = 'Please try again in a moment.' }) {
  return <Card role="alert" className="border-red-200 bg-red-50 shadow-none"><CardContent className="flex gap-3 p-5"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" /><div><p className="font-semibold text-red-950">{title}</p><p className="mt-1 text-sm text-red-800">{message}</p></div></CardContent></Card>
}
