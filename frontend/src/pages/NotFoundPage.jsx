import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/shared/PageContainer'

export function NotFoundPage() {
  return <PageContainer className="grid min-h-[60vh] place-items-center text-center"><div><p className="text-sm font-bold uppercase tracking-widest text-teal">404 · Page not found</p><h1 className="mt-3 text-4xl font-bold tracking-tight text-navy">We can’t find that page</h1><p className="mt-3 text-slate-600">The address may have changed or the page may not exist.</p><Link className="mt-7 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90" to="/">Return home</Link></div></PageContainer>
}
