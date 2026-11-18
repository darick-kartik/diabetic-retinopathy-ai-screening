export const DR_GRADES = [
  { grade: 0, short: 'No DR', name: 'No diabetic retinopathy', tone: 'emerald' },
  { grade: 1, short: 'Mild NPDR', name: 'Mild non-proliferative DR', tone: 'lime' },
  { grade: 2, short: 'Moderate NPDR', name: 'Moderate non-proliferative DR', tone: 'amber' },
  { grade: 3, short: 'Severe NPDR', name: 'Severe non-proliferative DR', tone: 'orange' },
  { grade: 4, short: 'Proliferative DR', name: 'Proliferative DR', tone: 'rose' },
]

export const gradeFor = (value) => value === null || value === undefined || value === ''
  ? null
  : DR_GRADES.find(({ grade }) => grade === Number(value)) || null

export const gradeBadgeClass = (grade) => {
  const classes = ['bg-emerald-50 text-emerald-800', 'bg-lime-50 text-lime-800', 'bg-amber-50 text-amber-900', 'bg-orange-50 text-orange-900', 'bg-rose-50 text-rose-900']
  return classes[Number(grade)] || 'bg-slate-100 text-slate-700'
}

export const probabilityEntries = (probabilities) => {
  if (Array.isArray(probabilities)) return probabilities.map((score, grade) => ({ grade, score: Number(score) }))
  if (!probabilities || typeof probabilities !== 'object') return []
  return DR_GRADES.flatMap(({ grade, short, name }) => {
    const value = probabilities[name] ?? probabilities[short] ?? probabilities[`class_${grade}`]
    return value === undefined || value === null || !Number.isFinite(Number(value))
      ? []
      : [{ grade, label: short, name, score: Number(value) }]
  })
}
