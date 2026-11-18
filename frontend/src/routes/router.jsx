import { createBrowserRouter } from 'react-router-dom'
import App from '@/App'
import { PublicLayout } from '@/layouts/PublicLayout'
import { PatientPortalLayout, DoctorPortalLayout, AdminPortalLayout } from '@/layouts/PortalLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { Loading } from '@/components/shared/Loading'
import { NotFoundPage } from '@/pages/NotFoundPage'

const lazyPage = (loader, name) => async () => {
  const module = await loader()
  return { Component: module[name] }
}

export const router = createBrowserRouter([{
  path: '/',
  element: <App />,
  children: [
    {
      element: <PublicLayout />,
      children: [
        { index: true, lazy: lazyPage(() => import('@/pages/LandingPage'), 'LandingPage') },
        { path: 'login', lazy: lazyPage(() => import('@/pages/LoginPage'), 'LoginPage') },
        { path: 'register', lazy: lazyPage(() => import('@/pages/RegisterPage'), 'RegisterPage') },
        { path: 'forgot-password', lazy: lazyPage(() => import('@/pages/LoginPage'), 'ForgotPasswordPage') },
        { path: 'reset-password', lazy: lazyPage(() => import('@/pages/LoginPage'), 'ResetPasswordPage') },
        { path: 'about', lazy: lazyPage(() => import('@/pages/InformationPages'), 'InformationPage') },
        { path: 'how-it-works', lazy: lazyPage(() => import('@/pages/InformationPages'), 'InformationPage') },
        { path: 'grades', lazy: lazyPage(() => import('@/pages/InformationPages'), 'InformationPage') },
        { path: 'privacy', lazy: lazyPage(() => import('@/pages/InformationPages'), 'InformationPage') },
        { path: 'disclaimer', lazy: lazyPage(() => import('@/pages/InformationPages'), 'InformationPage') },
        { path: 'help', lazy: lazyPage(() => import('@/pages/InformationPages'), 'InformationPage') },
        { path: 'unauthorized', lazy: lazyPage(() => import('@/pages/InformationPages'), 'UnauthorizedPage') },
        { path: 'dashboard', lazy: lazyPage(() => import('@/pages/InformationPages'), 'RoleHomeRedirect') },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
    {
      element: <ProtectedRoute roles={['PATIENT']} />,
      children: [{
        element: <PatientPortalLayout />,
        children: [
          { path: 'portal/patient', lazy: lazyPage(() => import('@/pages/DashboardPage'), 'DashboardPage') },
          { path: 'portal/patient/profile', lazy: lazyPage(() => import('@/pages/PatientPages'), 'PatientProfilePage') },
          { path: 'portal/patient/settings', lazy: lazyPage(() => import('@/pages/PatientPages'), 'PatientSettingsPage') },
          { path: 'portal/patient/upload', lazy: lazyPage(() => import('@/pages/PatientPages'), 'ScreeningUploadPage') },
          { path: 'portal/patient/history', lazy: lazyPage(() => import('@/pages/PatientPages'), 'ScreeningHistoryPage') },
          { path: 'portal/patient/screenings/:screeningId', lazy: lazyPage(() => import('@/pages/PatientPages'), 'ScreeningDetailPage') },
          { path: 'portal/patient/compare', lazy: lazyPage(() => import('@/pages/PatientPages'), 'ScreeningComparePage') },
          { path: 'portal/patient/record-answers', lazy: lazyPage(() => import('@/pages/RecordAnswersPage'), 'RecordAnswersPage') },
          { path: 'portal/patient/recommendations', lazy: lazyPage(() => import('@/pages/PatientPages'), 'RecommendationsPage') },
          { path: 'portal/patient/reports', lazy: lazyPage(() => import('@/pages/PatientPages'), 'ReportsPage') },
          { path: 'portal/patient/reports/:screeningId', lazy: lazyPage(() => import('@/pages/PatientPages'), 'ReportPreviewPage') },
          { path: 'portal/patient/treatment-plans', lazy: lazyPage(() => import('@/pages/PatientPages'), 'PatientTreatmentPlansPage') },
          { path: 'portal/patient/notifications', lazy: lazyPage(() => import('@/pages/PatientPages'), 'NotificationsPage') },
        ],
      }],
    },
    {
      element: <ProtectedRoute roles={['DOCTOR']} />,
      children: [{
        element: <DoctorPortalLayout />,
        children: [
          { path: 'portal/doctor', lazy: lazyPage(() => import('@/pages/RoleDashboardPages'), 'DoctorDashboardPage') },
          { path: 'portal/doctor/reviews', lazy: lazyPage(() => import('@/pages/PatientPages'), 'DoctorReviewQueuePage') },
          { path: 'portal/doctor/reviews/:screeningId', lazy: lazyPage(() => import('@/pages/PatientPages'), 'DoctorReviewPage') },
          { path: 'portal/doctor/patients', lazy: lazyPage(() => import('@/pages/RoleDashboardPages'), 'DoctorPatientsPage') },
          { path: 'portal/doctor/compare', lazy: lazyPage(() => import('@/pages/PatientPages'), 'ScreeningComparePage') },
          { path: 'portal/doctor/treatment', lazy: lazyPage(() => import('@/pages/PatientPages'), 'DoctorTreatmentPage') },
          { path: 'portal/doctor/reports', lazy: lazyPage(() => import('@/pages/PatientPages'), 'ReportsPage') },
          { path: 'portal/doctor/reports/:screeningId', lazy: lazyPage(() => import('@/pages/PatientPages'), 'ReportPreviewPage') },
          { path: 'portal/doctor/notifications', lazy: lazyPage(() => import('@/pages/PatientPages'), 'NotificationsPage') },
        ],
      }],
    },
    {
      element: <ProtectedRoute roles={['ADMIN']} />,
      children: [{
        element: <AdminPortalLayout />,
        children: [
          { path: 'portal/admin', lazy: lazyPage(() => import('@/pages/RoleDashboardPages'), 'AdminDashboardPage') },
          { path: 'portal/admin/users', lazy: lazyPage(() => import('@/pages/RoleDashboardPages'), 'AdminUsersPage') },
          { path: 'portal/admin/activity', lazy: async () => { const module = await import('@/pages/RoleDashboardPages'); return { Component: () => <module.AdminInfoPage title="System activity" /> } } },
          { path: 'portal/admin/model', lazy: async () => { const module = await import('@/pages/RoleDashboardPages'); return { Component: () => <module.AdminInfoPage title="Model information" /> } } },
          { path: 'portal/admin/notifications', lazy: lazyPage(() => import('@/pages/PatientPages'), 'NotificationsPage') },
        ],
      }],
    },
  ],
}])
