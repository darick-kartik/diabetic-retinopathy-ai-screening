import { cn } from '@/lib/utils'

export function Card({ className, ...props }) {
  return <div className={cn('rounded-card border border-white/70 bg-white/80 text-card-foreground shadow-soft backdrop-blur-md', className)} {...props} />
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}
