import { LoaderCircle } from 'lucide-react'

export function Loading({ label = 'Loading' }) {
  return <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin text-teal" aria-hidden="true" />{label}</div>
}
