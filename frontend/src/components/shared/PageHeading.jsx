export function PageHeading({ eyebrow, title, description, action }) {
  return <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>{eyebrow && <p className="text-sm font-semibold text-teal">{eyebrow}</p>}<h1 className="mt-1 text-title font-bold tracking-tight text-navy">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}</div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
}
