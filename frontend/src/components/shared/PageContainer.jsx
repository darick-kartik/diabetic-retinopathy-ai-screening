import { cn } from '@/lib/utils'

export function PageContainer({ className, ...props }) {
  return <main className={cn('mx-auto w-full max-w-7xl px-page-x py-10', className)} {...props} />
}
