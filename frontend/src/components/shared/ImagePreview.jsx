import { Eye, Maximize2 } from 'lucide-react'

export function ImagePreview({ label = 'Image unavailable', onExpand, src, alt }) {
  return <div className="relative overflow-hidden rounded-card border border-slate-200 bg-white">
    {src
      ? <img src={src} alt={alt || label} className="aspect-[4/3] w-full bg-slate-50 object-contain" />
      : <div className="grid aspect-[4/3] place-items-center bg-slate-50 px-4 text-center" role="img" aria-label={label}>
        <span className="flex flex-col items-center gap-2 text-slate-500"><Eye size={26} strokeWidth={1.5} /><span className="text-xs font-medium">{label}</span></span>
      </div>}
    {src && <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-navy/90 px-3 py-2 text-[11px] font-semibold text-white"><span>{label}</span>{onExpand && <button type="button" onClick={onExpand} className="rounded p-1 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label={`Expand ${label}`}><Maximize2 size={14} /></button>}</div>}
  </div>
}
