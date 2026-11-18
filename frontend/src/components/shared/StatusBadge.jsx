export function StatusBadge({ children, tone = 'slate' }) {
  const tones = { slate: 'bg-slate-100 text-slate-700', teal: 'bg-teal-50 text-teal-900', blue: 'bg-blue-50 text-blue-900', green: 'bg-emerald-50 text-emerald-800', amber: 'bg-amber-50 text-amber-900', rose: 'bg-rose-50 text-rose-900' }
  return <span className={`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.slate}`}>{children}</span>
}
