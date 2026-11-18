import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircleQuestion, Search, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageHeading } from '@/components/shared/PageHeading'
import { Loading } from '@/components/shared/Loading'
import { StateView } from '@/components/shared/StateView'
import { usePortalQuery } from '@/hooks/usePortalQuery'
import { service } from '@/services'
import { gradeFor } from '@/constants/screening'

const displayDate = (date) => new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' })

function answerFromRecords(question, records) {
  const text = question.trim().toLowerCase()
  if (!text) return null

  const eye = text.includes('left') ? 'LEFT' : text.includes('right') ? 'RIGHT' : null
  const matchingEye = eye ? records.filter((record) => record.eyeSide === eye) : records
  const matchingId = records.filter((record) => text.includes(record.id.toLowerCase()))
  if (matchingId.length) return { message: 'Here is the screening record that matches the ID you entered.', records: matchingId }
  if (/how many|count|number of|total/.test(text)) return { message: `Your account has ${matchingEye.length} ${eye ? `${eye.toLowerCase()} eye ` : ''}screening ${matchingEye.length === 1 ? 'record' : 'records'}.`, records: matchingEye }
  if (/latest|last|most recent|recent/.test(text)) {
    const latest = [...matchingEye].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 1)
    const asksGrade = /grade|category|result|prediction|outcome/.test(text)
    const grade = latest.length ? gradeFor(latest[0].grade) : null
    const result = asksGrade && latest.length ? ` It shows ${grade ? `${grade.name} (Grade ${grade.grade})` : 'no model category recorded'}; this is a research output, not a diagnosis.` : ''
    return { message: latest.length ? `The latest ${eye ? `${eye.toLowerCase()} eye ` : ''}record is dated ${displayDate(latest[0].date)}.${result}` : `There are no ${eye ? `${eye.toLowerCase()} eye ` : ''}records in your screening history.`, records: latest }
  }
  if (/grade|category|result|prediction|outcome/.test(text)) {
    const dated = matchingEye.find((record) => text.includes(new Date(record.date).toLocaleDateString().toLowerCase()))
    const selected = dated || [...matchingEye].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 1)[0]
    if (!selected) return { message: `There is no ${eye ? `${eye.toLowerCase()} eye ` : ''}screening record to answer from.`, records: [] }
    const grade = gradeFor(selected.grade)
    const result = grade ? `${grade.name} (Grade ${grade.grade})` : 'no model category recorded'
    return { message: `${displayDate(selected.date)}: the saved model record shows ${result}. This is a research output, not a diagnosis.`, records: [selected] }
  }
  if (eye || /screening|history|record|records/.test(text)) {
    const list = [...matchingEye].sort((a, b) => new Date(b.date) - new Date(a.date))
    return { message: list.length ? `I found ${list.length} ${eye ? `${eye.toLowerCase()} eye ` : ''}screening ${list.length === 1 ? 'record' : 'records'} in your account.` : `There are no ${eye ? `${eye.toLowerCase()} eye ` : ''}screening records in your account.`, records: list }
  }
  return { message: 'I can only answer using screening records in your account. Try asking how many screenings you have, when your latest screening was, or what model category a saved record shows.', records: [] }
}

export function RecordAnswersPage() {
  const { data: records = [], isLoading, isError, error, refetch } = usePortalQuery('record-answers', (user, signal) => service.getScreenings(user, signal))
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)

  if (isLoading) return <PageContainer><Loading label="Loading your screening records" /></PageContainer>
  if (isError) return <PageContainer><StateView title="Your records could not be loaded" message={error.message} kind="error" action="Try again" onAction={refetch} /></PageContainer>

  const ask = (event) => {
    event.preventDefault()
    setAnswer(answerFromRecords(question, records))
  }

  return <PageContainer>
    <PageHeading eyebrow="Private patient workspace" title="Ask about my records" description="Ask a question about screening entries saved in your account. Answers use only your loaded record data." />
    <div className="mb-5 flex items-start gap-3 rounded-control border border-blue/20 bg-blue-50/70 p-4 text-sm leading-6 text-blue-950"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue" /><p><strong>Record facts only.</strong> This tool does not answer general health questions, interpret symptoms, or provide diagnosis or treatment advice. Model grades are research outputs.</p></div>
    <Card className="border-slate-200"><CardContent className="p-5 sm:p-7">
      <form onSubmit={ask} className="flex flex-col gap-3 sm:flex-row"><label htmlFor="record-question" className="sr-only">Ask a question about your screening records</label><input id="record-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="For example: When was my latest left eye screening?" className="h-12 min-w-0 flex-1 rounded-control border border-input bg-white px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /><button type="submit" disabled={!question.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-teal px-5 text-sm font-semibold text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-50"><Search size={16} /> Ask</button></form>
      <div className="mt-4 flex flex-wrap gap-2">{['How many screenings are saved?', 'What is my latest model category?', 'Show my left eye records'].map((prompt) => <button key={prompt} type="button" onClick={() => { setQuestion(prompt); setAnswer(answerFromRecords(prompt, records)) }} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-teal hover:text-teal">{prompt}</button>)}</div>
    </CardContent></Card>
    {answer && <section className="mt-5" aria-live="polite"><Card className="border-slate-200"><CardContent className="p-5 sm:p-7"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-clinic text-teal"><MessageCircleQuestion size={18} /></span><div className="min-w-0 flex-1"><h2 className="font-semibold text-navy">Answer from your records</h2><p className="mt-2 text-sm leading-6 text-slate-700">{answer.message}</p>{answer.records.length > 0 && <div className="mt-4 divide-y divide-slate-100">{answer.records.map((record) => { const grade = gradeFor(record.grade); return <div key={record.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-slate-600">{displayDate(record.date)} · {record.eyeSide || 'Unknown'} eye · {grade ? grade.short : 'No model category recorded'}</span><Link to={`/portal/patient/screenings/${record.id}`} className="inline-flex items-center gap-1 font-semibold text-teal hover:underline">Open record <ArrowRight size={14} /></Link></div> })}</div>}</div></div></CardContent></Card></section>}
  </PageContainer>
}
