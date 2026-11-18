import { Link } from 'react-router-dom'
import { ArrowLeft, CircleHelp, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageHeading } from '@/components/shared/PageHeading'

function PortalUnavailable({ role, title, capability }) {
  return <PageContainer>
    <PageHeading eyebrow={`${role} workspace`} title={title} description={`This workspace requires ${capability}. The current FastAPI backend does not expose that capability.`} />
    <Card className="max-w-3xl border-slate-200 shadow-none">
      <CardContent className="flex gap-4 p-5 sm:p-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-card bg-clinic text-navy"><ShieldCheck size={20} /></span>
        <div>
          <h2 className="font-semibold text-navy">No records are available here</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">This view does not use placeholder accounts or screening data. Ask the system administrator to add the required backend endpoint and authorization checks before enabling it.</p>
          <Link to="/help" className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-control border border-input bg-white px-4 text-sm font-semibold text-navy transition hover:bg-clinic"><CircleHelp size={16} /> Backend support details</Link>
        </div>
      </CardContent>
    </Card>
  </PageContainer>
}

export function DoctorDashboardPage() {
  return <PortalUnavailable role="Doctor" title="Doctor workspace" capability="a doctor dashboard and patient review APIs" />
}

export function DoctorPatientsPage() {
  return <PortalUnavailable role="Doctor" title="Patient directory" capability="a role-restricted patient directory endpoint" />
}

export function AdminDashboardPage() {
  return <PortalUnavailable role="Admin" title="System overview" capability="authorized administrative metrics" />
}

export function AdminUsersPage() {
  return <PortalUnavailable role="Admin" title="User management" capability="authorized user management APIs" />
}

export function AdminInfoPage({ title = 'System information' }) {
  return <PortalUnavailable role="Admin" title={title} capability="an administrative system information endpoint" />
}
