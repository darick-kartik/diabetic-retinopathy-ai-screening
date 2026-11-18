import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Activity, ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Download, FileClock, GitCompareArrows, LoaderCircle, Plus, Printer, ShieldCheck, UploadCloud } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageHeading } from '@/components/shared/PageHeading'
import { StateView } from '@/components/shared/StateView'
import { Loading } from '@/components/shared/Loading'
import { ImagePreview } from '@/components/shared/ImagePreview'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ScreeningTable } from '@/components/shared/ScreeningTable'
import { gradeBadgeClass, gradeFor, probabilityEntries, DR_GRADES } from '@/constants/screening'
import { useAuth } from '@/contexts/AuthContext'
import { usePortalQuery } from '@/hooks/usePortalQuery'
import { usePrivateImage } from '@/hooks/usePrivateImage'
import { service } from '@/services'

const prettyDate = (date) => date ? new Date(date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded'
const errorBlock = (error, retry) => <StateView title="This information could not be loaded" message={error?.message || 'Please try again.'} kind="error" action="Try again" onAction={retry} />

function ComparisonImage({ record }) {
  const source = usePrivateImage(record.originalImageUrl)
  return <ImagePreview src={source} label={source ? 'Uploaded retinal image' : 'Image unavailable'} alt={record.imageName || 'Screening image'} />
}

export function ScreeningHistoryPage() {
  const { data = [], isLoading, isError, error, refetch } = usePortalQuery('screening-history', (user, signal) => service.getScreenings(user, signal))
  const [search, setSearch] = useState('')
  const [eye, setEye] = useState('ALL')
  const [grade, setGrade] = useState('ALL')
  const [review, setReview] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  if (isLoading) return <PageContainer><Loading label="Loading screening history" /></PageContainer>
  if (isError) return <PageContainer>{errorBlock(error, refetch)}</PageContainer>
  const filtered = data.filter((item) => {
    const recordDate = new Date(item.date).toISOString().slice(0, 10)
    return (!search || item.id.toLowerCase().includes(search.toLowerCase())) && (eye === 'ALL' || item.eyeSide === eye) && (grade === 'ALL' || String(item.grade) === grade) && (review === 'ALL' || item.reviewStatus === review) && (!dateFrom || recordDate >= dateFrom) && (!dateTo || recordDate <= dateTo)
  }).sort((a, b) => sort === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date))
  const perPage = 6
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage))
  const shown = filtered.slice((page - 1) * perPage, page * perPage)
  return <PageContainer><PageHeading eyebrow="Patient workspace" title="Screening history" description="Each screening remains a separate record. Filters apply only to this account." action={<Link to="/portal/patient/upload" className="inline-flex h-10 items-center gap-2 rounded-control bg-teal px-4 text-sm font-semibold text-white hover:bg-teal/90"><Plus size={16} /> Add screening</Link>} />
    <Card className="mb-5 border-slate-200 shadow-none"><CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-7">
      <label className="text-xs font-semibold text-slate-600 xl:col-span-2">Search screening ID<input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search by ID" className="mt-1.5 h-10 w-full rounded-control border border-input px-3 text-sm font-normal text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
      <label className="text-xs font-semibold text-slate-600">Eye<select value={eye} onChange={(event) => setEye(event.target.value)} className="mt-1.5 h-10 w-full rounded-control border border-input bg-white px-3 text-sm font-normal"><option value="ALL">Both eyes</option><option>LEFT</option><option>RIGHT</option><option>UNKNOWN</option></select></label>
      <label className="text-xs font-semibold text-slate-600">Grade<select value={grade} onChange={(event) => setGrade(event.target.value)} className="mt-1.5 h-10 w-full rounded-control border border-input bg-white px-3 text-sm font-normal"><option value="ALL">All grades</option>{DR_GRADES.map((item) => <option key={item.grade} value={item.grade}>{item.grade} · {item.short}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600">Review status<select value={review} onChange={(event) => setReview(event.target.value)} className="mt-1.5 h-10 w-full rounded-control border border-input bg-white px-3 text-sm font-normal"><option value="ALL">Any status</option><option value="REVIEWED">Reviewed</option><option value="UNREVIEWED">Not reviewed</option><option value="IN_REVIEW">In review</option></select></label>
      <label className="text-xs font-semibold text-slate-600">From date<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1.5 h-10 w-full rounded-control border border-input bg-white px-2 text-xs font-normal" /></label>
      <label className="text-xs font-semibold text-slate-600">To date<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1.5 h-10 w-full rounded-control border border-input bg-white px-2 text-xs font-normal" /></label>
    </CardContent></Card>
    <Card className="border-slate-200 shadow-none"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base text-navy">{filtered.length} record{filtered.length === 1 ? '' : 's'}</CardTitle><label className="flex items-center gap-2 text-xs font-semibold text-slate-600">Sort <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-control border border-input bg-white px-2 py-1.5"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></CardHeader><CardContent className="pt-0"><ScreeningTable records={shown} /><div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500"><span>Page {page} of {pageCount}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={15} /> Previous</Button><Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next <ChevronRight size={15} /></Button></div></div></CardContent></Card>
  </PageContainer>
}

export function ScreeningDetailPage() {
  const { screeningId } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const location = useLocation()
  const query = useQuery({ queryKey: ['screening', user?.id, screeningId], queryFn: ({ signal }) => service.getScreening(user, screeningId, signal), enabled: Boolean(user && screeningId) })
  const record = query.data
  const [predictionWorking, setPredictionWorking] = useState(false)
  const [predictionError, setPredictionError] = useState('')
  const [expandedImage, setExpandedImage] = useState(null)
  const original = usePrivateImage(record?.originalImageUrl)
  const gradcam = usePrivateImage(record?.gradcamUrl)
  useEffect(() => {
    if (!expandedImage) return undefined
    const closeOnEscape = (event) => { if (event.key === 'Escape') setExpandedImage(null) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [expandedImage])
  if (query.isLoading) return <PageContainer><Loading label="Loading screening details" /></PageContainer>
  if (query.isError) return <PageContainer>{errorBlock(query.error, query.refetch)}</PageContainer>
  const grade = gradeFor(record.grade)
  const probabilities = probabilityEntries(record.probabilities)
  const runPrediction = async () => {
    setPredictionWorking(true)
    setPredictionError('')
    try {
      await service.createPrediction(user, record.imageId)
      await queryClient.invalidateQueries({ queryKey: ['screening', user.id, screeningId] })
      await queryClient.invalidateQueries({ queryKey: ['screening-history', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['patient-dashboard', user.id] })
    } catch (requestError) {
      setPredictionError(requestError.message)
    } finally {
      setPredictionWorking(false)
    }
  }

  return <PageContainer><Link to={user.role === 'DOCTOR' ? '/portal/doctor/reviews' : '/portal/patient/history'} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-teal hover:underline"><ArrowLeft size={16} /> Back to history</Link>
    <PageHeading eyebrow="Screening record" title={record.id} description={`${prettyDate(record.date)} · ${record.eyeSide || 'Unknown'} eye`} action={<button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-control border border-slate-200 bg-white px-4 text-sm font-semibold text-navy hover:bg-slate-50"><Printer size={16} /> Print summary</button>} />
    {location.state?.uploadNotice && <div role="status" className="mb-5 rounded-control border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{location.state.uploadNotice}</div>}
    <div className="mb-5 rounded-control border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950"><strong>Research-only result:</strong> This record is not a diagnosis. Model scores may be uncalibrated, and Grad-CAM does not confirm lesions. Qualified clinician review is required.</div>
    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <Card className="border-slate-200 shadow-none"><CardHeader className="flex-row items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Model category</p><CardTitle className="mt-2 text-xl text-navy">{grade ? grade.name : 'Prediction not available'}</CardTitle><p className="mt-2 text-xs text-slate-600">{record.modelName || 'No model data'} {record.modelVersion ? `· ${record.modelVersion}` : ''}</p></div>{grade && <span className={`rounded-pill px-3 py-1.5 text-xs font-bold ${gradeBadgeClass(grade.grade)}`}>Grade {grade.grade}</span>}</CardHeader><CardContent>
        <div className="mb-4 rounded-control border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">{record.predictionPending ? 'This image has been uploaded. A prediction has not been created yet.' : 'Research output · model scores are not diagnostic confidence.'}</div>
        {record.predictionPending && <div className="mb-4"><Button disabled={predictionWorking} onClick={runPrediction}>{predictionWorking ? 'Requesting prediction…' : 'Request prediction'}</Button>{predictionError && <p role="alert" className="mt-2 text-sm text-rose-700">{predictionError}</p>}</div>}
        {!probabilities.length && !record.predictionPending && <p className="rounded-control bg-slate-50 p-4 text-sm text-slate-600">The backend has not returned class probabilities for this record.</p>}
        {probabilities.length > 0 && <div className="h-64 w-full" aria-label="Class score chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={probabilities} layout="vertical" margin={{ top: 3, right: 16, bottom: 0, left: 12 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Model score']} /><Bar dataKey="score" fill="#0D9488" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div>}
        <p className="mt-2 text-[11px] text-slate-500">The model outputs category scores. They are not validated confidence estimates.</p>
      </CardContent></Card>
      <div className="space-y-5">
        <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-base text-navy">Image & explainability</CardTitle><p className="text-xs leading-5 text-slate-600">Grad-CAM highlights model attention patterns only and does not establish disease.</p></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><div><ImagePreview src={original} label={original ? 'Uploaded retinal image' : 'Image unavailable'} alt={record.imageName} onExpand={original ? () => setExpandedImage('original') : undefined} />{original && <a href={original} download={`${record.imageId}-original`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline"><Download size={13} /> Download image</a>}</div><div><ImagePreview src={gradcam} label={gradcam ? 'Grad-CAM · research visualization' : 'Grad-CAM unavailable'} onExpand={gradcam ? () => setExpandedImage('gradcam') : undefined} />{gradcam && <a href={gradcam} download={`${record.id}-gradcam.png`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline"><Download size={13} /> Download visualization</a>}</div></CardContent></Card>
        <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-base text-navy">Human review</CardTitle></CardHeader><CardContent>{record.reviewedAt ? <div className="space-y-2 text-sm"><StatusBadge tone="teal">{record.reviewStatus || 'Review recorded'}</StatusBadge><p className="font-semibold text-navy">{record.reviewedGrade === null || record.reviewedGrade === undefined ? 'No reviewed grade returned' : `Reviewed grade ${record.reviewedGrade}`}</p>{record.reviewNotes && <p className="leading-6 text-slate-600">{record.reviewNotes}</p>}<p className="text-xs text-slate-500">{prettyDate(record.reviewedAt)}</p></div> : <div className="text-sm text-slate-600"><StatusBadge tone="amber">{record.reviewStatus || 'Unavailable'}</StatusBadge><p className="mt-2">No review details were returned for this prediction.</p></div>}</CardContent></Card>
        {user.role === 'PATIENT' && <Link to="/portal/patient/recommendations" state={{ screeningId: record.id }} className="flex h-11 items-center justify-center gap-2 rounded-control bg-teal px-4 text-sm font-semibold text-white hover:bg-teal/90"><Activity size={16} /> Explore educational guidance</Link>}
        {user.role === 'DOCTOR' && <Link to={`/portal/doctor/reviews/${record.id}`} className="flex h-11 items-center justify-center gap-2 rounded-control bg-teal px-4 text-sm font-semibold text-white">Open doctor review</Link>}
      </div>
    </div>
    {expandedImage && <div className="fixed inset-0 z-50 grid place-items-center bg-navy/80 p-5" role="dialog" aria-modal="true" aria-label="Expanded screening visualization" onClick={() => setExpandedImage(null)}><div className="w-full max-w-3xl" onClick={(event) => event.stopPropagation()}><ImagePreview src={expandedImage === 'original' ? original : gradcam} label={expandedImage === 'gradcam' ? 'Grad-CAM visualization' : 'Retinal image'} /><button autoFocus onClick={() => setExpandedImage(null)} className="mt-3 w-full rounded-control bg-white px-4 py-2 text-sm font-semibold text-navy">Close visualization</button></div></div>}
  </PageContainer>
}

export function ScreeningUploadPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [eyeSide, setEyeSide] = useState('UNKNOWN')
  const [progress, setProgress] = useState(0)
  const [stageIndex, setStageIndex] = useState(-1)
  const [working, setWorking] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')
  const stages = ['Upload image', 'Request prediction', 'Request Grad-CAM']

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const selectFile = (nextFile) => {
    setError('')
    if (!nextFile) return
    if (!['image/jpeg', 'image/png'].includes(nextFile.type)) { setFile(null); setPreview(''); setError('Please select a JPEG or PNG image.'); return }
    if (nextFile.size > 10 * 1024 * 1024) { setFile(null); setPreview(''); setError('The maximum supported file size is 10 MB.'); return }
    setFile(nextFile)
    setPreview(URL.createObjectURL(nextFile))
  }

  const start = async () => {
    if (!file) return
    setConfirming(false)
    setWorking(true)
    setError('')
    try {
      const record = await service.createScreening(user, {
        file,
        eyeSide,
        onProgress: (value) => {
          setProgress(Math.round(value * 0.4))
          setStageIndex(0)
        },
        onPhase: (phase) => {
          const nextStage = phase === 'prediction' ? 1 : 2
          setStageIndex(nextStage)
          setProgress(nextStage === 1 ? 55 : 82)
        },
      })
      setStageIndex(stages.length)
      setProgress(100)
      await queryClient.invalidateQueries({ queryKey: ['screening-history', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['patient-dashboard', user.id] })
      navigate(`/portal/patient/screenings/${record.id}`, { state: { uploadNotice: record.predictionError ? 'The image was saved to your account, but prediction could not be completed. You can retry from this record.' : null } })
    } catch (requestError) {
      setError(requestError.message || 'Upload or screening failed. Please try again.')
      setWorking(false)
    }
  }

  if (user.isDemo) return <PageContainer><PageHeading eyebrow="Demo workspace" title="Image upload is disabled" description="The demo workspace is for exploring screens and filters with synthetic records." /><StateView title="Connect FastAPI to run a real screening" message="Image upload, model inference and Grad-CAM require the connected backend and database. Demo mode does not accept images or generate simulated medical results." /><Link to="/portal/patient" className="mt-4 inline-flex h-10 items-center rounded-control bg-teal px-4 text-sm font-semibold text-white">Return to overview</Link></PageContainer>

  return (
    <PageContainer>
      <PageHeading eyebrow="New retinal image" title="Upload a retinal image" description="Your image is sent to the authenticated FastAPI service. JPEG and PNG files up to 10 MB are accepted." />
      <div className="mb-5 rounded-control border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Research prototype:</strong> Model output is not a diagnosis and should be reviewed by a qualified eye-care professional.</div>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="border-slate-200 shadow-none">
          <CardHeader><CardTitle className="text-base text-navy">Retinal image</CardTitle><p className="text-xs text-slate-600">Select an image you are authorized to upload. Remove the file to clear its local preview.</p></CardHeader>
          <CardContent>
            <label onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files?.[0]) }} className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-teal hover:bg-teal-50/40 focus-within:ring-2 focus-within:ring-teal">
              <UploadCloud className="mb-3 text-teal" size={29} /><span className="text-sm font-semibold text-navy">Drop an image here or browse files</span><span className="mt-1 text-xs text-slate-500">JPEG or PNG · max 10 MB</span>
              <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0])} />
            </label>
            {error && <p role="alert" className="mt-3 rounded-control bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
            {file && <div className="mt-4 flex flex-wrap items-center gap-4 rounded-card border border-slate-200 p-4"><img src={preview} alt="Selected upload preview" className="h-28 w-36 rounded-control bg-slate-100 object-contain" /><div className="min-w-0 flex-1"><p className="break-all text-sm font-semibold text-navy">{file.name}</p><p className="mt-1 text-xs text-slate-600">{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}</p><button type="button" onClick={() => { setFile(null); setPreview('') }} className="mt-2 text-xs font-semibold text-rose-700 hover:underline">Remove and choose another</button></div></div>}
            <label className="mt-5 block text-sm font-semibold text-slate-700">Eye side<select value={eyeSide} onChange={(event) => setEyeSide(event.target.value)} className="mt-1.5 h-11 w-full rounded-control border border-input bg-white px-3 text-sm"><option value="UNKNOWN">Unknown / not specified</option><option value="LEFT">Left eye</option><option value="RIGHT">Right eye</option></select></label>
            {working && <div className="mt-5 rounded-control bg-slate-50 p-4" aria-live="polite"><div className="mb-3 flex justify-between text-xs font-semibold text-slate-700"><span>Sending request to FastAPI</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-pill bg-slate-200"><div className="h-full rounded-pill bg-teal transition-all" style={{ width: `${progress}%` }} /></div><ol className="mt-3 space-y-2">{stages.map((stage, index) => <li key={stage} className={`flex items-center gap-2 text-xs ${index <= stageIndex ? 'font-semibold text-teal-900' : 'text-slate-500'}`}>{index < stageIndex ? <Check size={14} /> : index === stageIndex ? <LoaderCircle size={14} className="animate-spin" /> : <span className="h-3.5 w-3.5 rounded-full border border-slate-300" />}{stage}</li>)}</ol></div>}
            <Button className="mt-5 w-full" disabled={!file || working} onClick={() => setConfirming(true)}>Continue to confirmation</Button>
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-base text-navy">What happens next?</CardTitle></CardHeader><CardContent><ol className="space-y-4">{stages.map((stage, index) => <li key={stage} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-bold text-teal">{index + 1}</span><span className="pt-1 text-sm text-slate-700">{stage}</span></li>)}</ol></CardContent></Card>
          <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-base text-navy">Data handling</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-slate-600">The preview is temporary and is cleared when you leave this page. On confirmation, the actual file is uploaded to the configured backend and linked to the authenticated patient profile.</CardContent></Card>
        </div>
      </div>
      {confirming && <div className="fixed inset-0 z-50 grid place-items-center bg-navy/50 p-5" role="dialog" aria-modal="true" aria-labelledby="upload-confirm-title"><Card className="w-full max-w-lg border-slate-100"><CardHeader><CardTitle id="upload-confirm-title" className="text-xl text-navy">Confirm upload and analysis</CardTitle><p className="text-sm leading-6 text-slate-600">The image will be stored under your authenticated patient profile. The app requests a prediction only after the image upload succeeds.</p></CardHeader><CardContent><div className="rounded-control bg-amber-50 p-3 text-xs leading-5 text-amber-950">Model output is for research use and must not be used alone for a health decision.</div><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirming(false)}>Cancel</Button><Button onClick={start}>Upload and request prediction</Button></div></CardContent></Card></div>}
    </PageContainer>
  )
}
export function ScreeningComparePage() {
  const { user } = useAuth()
  const { data = [], isLoading, isError, error, refetch } = usePortalQuery('screenings-to-compare', (account, signal) => service.getScreenings(account, signal))
  const compatible = data.filter(({ grade, eyeSide }) => grade !== null && eyeSide !== 'UNKNOWN')
  const [firstId, setFirstId] = useState('')
  const [secondId, setSecondId] = useState('')
  const first = compatible.find(({ id }) => id === firstId) || compatible[0]
  const options = compatible.filter((item) => item.eyeSide === first?.eyeSide && item.id !== first?.id)
  const second = options.find(({ id }) => id === secondId) || options[0]
  if (isLoading) return <PageContainer><Loading label="Loading compatible records" /></PageContainer>
  if (isError) return <PageContainer>{errorBlock(error, refetch)}</PageContainer>
  if (compatible.length < 2) return <PageContainer><PageHeading eyebrow="Patient workspace" title="Compare screening records" description="Compare completed model outputs for the same eye." /><StateView title="Two compatible records are needed" message="Your account does not yet have two completed prediction records for the same known eye side." /><Link to="/portal/patient/upload" className="mt-4 inline-flex h-10 items-center gap-2 rounded-control bg-teal px-4 text-sm font-semibold text-white">Upload an image <ArrowRight size={15} /></Link></PageContainer>
  const chartData = compatible.filter((item) => !first || item.eyeSide === first.eyeSide).sort((a, b) => new Date(a.date) - new Date(b.date)).map((item) => ({ date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), grade: item.grade }))
  return <PageContainer><PageHeading eyebrow="Patient workspace" title="Compare screening records" description="Choose records for the same eye. Differences in model grades do not establish progression, improvement, or treatment effect." />
    <div className="mb-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Earlier / first record<select value={first?.id || ''} onChange={(event) => { setFirstId(event.target.value); setSecondId('') }} className="mt-1.5 h-11 w-full rounded-control border border-input bg-white px-3">{compatible.map((item) => <option key={item.id} value={item.id}>{new Date(item.date).toLocaleDateString()} · {item.eyeSide} · Grade {item.grade}</option>)}</select></label><label className="text-sm font-semibold text-slate-700">Second record<select value={second?.id || ''} onChange={(event) => setSecondId(event.target.value)} className="mt-1.5 h-11 w-full rounded-control border border-input bg-white px-3">{options.map((item) => <option key={item.id} value={item.id}>{new Date(item.date).toLocaleDateString()} · {item.eyeSide} · Grade {item.grade}</option>)}</select></label></div>
    {!first || !second ? <StateView title="More compatible records are needed" message="Two completed records for the same eye are required for a meaningful side-by-side comparison." /> : <>
      <p className="mb-4 rounded-control bg-clinic p-3 text-sm leading-6 text-slate-700">Recorded model categories: Grade {first.grade} on {new Date(first.date).toLocaleDateString()} and Grade {second.grade} on {new Date(second.date).toLocaleDateString()}. This summary describes stored outputs only and does not imply progression or improvement.</p>
      <div className="mb-5 grid gap-4 lg:grid-cols-2">{[first, second].map((item) => <Card key={item.id} className="border-slate-200 shadow-none"><CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-base text-navy">{new Date(item.date).toLocaleDateString()}</CardTitle><p className="mt-1 text-xs text-slate-500">{item.eyeSide} eye · {item.id}</p></div><span className={`rounded-pill px-3 py-1.5 text-xs font-bold ${gradeBadgeClass(item.grade)}`}>Grade {item.grade} · {gradeFor(item.grade)?.short}</span></CardHeader><CardContent><ComparisonImage record={item} /></CardContent></Card>)}</div>
      <Card className="mb-5 border-slate-200 shadow-none"><CardHeader><CardTitle className="text-base text-navy">Model score comparison</CardTitle><p className="text-xs text-slate-600">Estimated category scores from separate records. They are uncalibrated.</p></CardHeader><CardContent className="grid gap-7 md:grid-cols-2">{[first, second].map((item) => <div key={item.id} className="h-56"><p className="mb-2 text-xs font-semibold text-slate-600">{new Date(item.date).toLocaleDateString()}</p><ResponsiveContainer width="100%" height="100%"><BarChart data={probabilityEntries(item.probabilities)} layout="vertical" margin={{ left: 5, right: 10 }}><XAxis type="number" domain={[0, 1]} hide /><YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Model score']} /><Bar dataKey="score" fill="#087e8b" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>)}</CardContent></Card>
      <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-base text-navy">Recorded grade timeline</CardTitle></CardHeader><CardContent><div className="h-60"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} /><Tooltip /><Line dataKey="grade" stroke="#087e8b" strokeWidth={2} /></LineChart></ResponsiveContainer></div><p className="mt-2 text-xs leading-5 text-amber-900">The timeline reflects recorded model categories only. It cannot establish disease progression, improvement, or treatment effectiveness.</p></CardContent></Card>
    </>}
  </PageContainer>
}

export function PatientProfilePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: profile, isLoading, isError, error, refetch } = usePortalQuery('patient-profile', (account, signal) => service.getProfile(account, signal))
  const schema = z.object({ dateOfBirth: z.string().optional(), gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']) })
  const form = useForm({ resolver: zodResolver(schema, undefined, { mode: 'sync' }), values: profile ? { dateOfBirth: profile.dateOfBirth || '', gender: profile.gender || 'PREFER_NOT_TO_SAY' } : undefined })
  const [saved, setSaved] = useState(false)
  const [errorText, setErrorText] = useState('')
  if (isLoading) return <PageContainer><Loading label="Loading account profile" /></PageContainer>
  if (isError) return <PageContainer>{errorBlock(error, refetch)}</PageContainer>
  const submit = form.handleSubmit(async (values) => {
    setSaved(false); setErrorText('')
    try {
      const updated = await service.updateProfile(user, values)
      queryClient.setQueryData(['patient-profile', user.id], updated)
      setSaved(true)
    } catch (requestError) { setErrorText(requestError.message) }
  })
  const fieldClass = 'mt-1.5 h-11 w-full rounded-control border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
  return <PageContainer><PageHeading eyebrow="Patient workspace" title="Profile" description="Your account identity comes from authentication. The current patient profile API supports date of birth and gender." />
    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-base text-navy">Personal information</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Full name<input value={profile.fullName || ''} readOnly className={`${fieldClass} bg-slate-50 text-slate-600`} /></label>
        <label className="text-sm font-medium text-slate-700">Email<input value={profile.email || ''} disabled className={`${fieldClass} bg-slate-50 text-slate-500`} /></label>
        <label className="text-sm font-medium text-slate-700">Date of birth<input type="date" max={new Date().toISOString().slice(0, 10)} {...form.register('dateOfBirth')} className={fieldClass} /></label>
        <label className="text-sm font-medium text-slate-700">Gender<select {...form.register('gender')} className={fieldClass}><option value="PREFER_NOT_TO_SAY">Prefer not to say</option><option value="FEMALE">Female</option><option value="MALE">Male</option><option value="OTHER">Other</option></select></label>
        <label className="text-sm font-medium text-slate-700">Patient code<input value={profile.patientCode || 'Not assigned'} disabled className={`${fieldClass} bg-slate-50 text-slate-500`} /></label>
        {errorText && <p role="alert" className="sm:col-span-2 text-sm text-rose-700">{errorText}</p>}{saved && <p role="status" className="sm:col-span-2 text-sm font-semibold text-emerald-800">Profile saved.</p>}
        <div className="sm:col-span-2"><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Saving…' : 'Save profile'}</Button></div>
      </form></CardContent></Card>
      <div className="space-y-5"><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-base text-navy">Profile API coverage</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-600">Phone number, diabetes history and editable name fields are not part of the current backend profile schema, so they are not collected or stored here.</p><p className="mt-3 text-sm text-slate-600">Password recovery and password change endpoints are also unavailable. Contact your system administrator for account support.</p></CardContent></Card><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-base text-navy">Session security</CardTitle></CardHeader><CardContent className="space-y-2 text-sm leading-6 text-slate-700"><p>Passwords are sent only to the authentication endpoint and are never persisted by the frontend.</p><p>The current JWT remains in sessionStorage until sign out or expiry. The backend does not provide HttpOnly cookie authentication.</p></CardContent></Card></div>
    </div>
  </PageContainer>
}

function FeatureUnavailable({ title, capability }) {
  const { user } = useAuth()
  const returnPath = `/portal/${user?.role?.toLowerCase() || 'patient'}`
  return <PageContainer>
    <PageHeading eyebrow="Backend capability" title={title} description={"The current FastAPI backend does not expose " + capability + "."} />
    <Card className="max-w-3xl border-slate-200 shadow-none"><CardContent className="flex gap-4 p-5 sm:p-6">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-card bg-clinic text-navy"><ShieldCheck size={20} /></span>
      <div><h2 className="font-semibold text-navy">No information is being fabricated</h2><p className="mt-2 text-sm leading-6 text-slate-600">This feature will remain unavailable until the backend provides the required authenticated endpoint and ownership or role checks.</p><Link to={returnPath} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal"><ArrowLeft size={15} /> Return to your overview</Link></div>
    </CardContent></Card>
  </PageContainer>
}

export function RecommendationsPage() { return <FeatureUnavailable title="Care education" capability="recommendation content and source retrieval" /> }
export function NotificationsPage() { return <FeatureUnavailable title="Notifications" capability="a patient-specific notification feed" /> }
export function ReportsPage() { return <FeatureUnavailable title="Reports" capability="report history and generated report files" /> }
export function ReportPreviewPage() { return <FeatureUnavailable title="Report preview" capability="a report generation and retrieval API" /> }
export function PatientTreatmentPlansPage() { return <FeatureUnavailable title="Doctor-issued plans" capability="doctor-reviewed treatment plan and prescription APIs" /> }
export function PatientSettingsPage() { return <FeatureUnavailable title="Account settings" capability="password change and account preference APIs" /> }
export function DoctorReviewQueuePage() { return <FeatureUnavailable title="Doctor review queue" capability="role-restricted review queue and patient access APIs" /> }
export function DoctorReviewPage() { return <FeatureUnavailable title="Doctor review" capability="doctor assessment and review persistence APIs" /> }
export function DoctorTreatmentPage() { return <FeatureUnavailable title="Treatment plans" capability="doctor-authorized treatment plan and prescription APIs" /> }
