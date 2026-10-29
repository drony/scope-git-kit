import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import Home from '@/pages/Home'

// Everything except the home page is split into its own chunk.
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Markets = lazy(() => import('@/pages/Markets'))
const Asset = lazy(() => import('@/pages/Asset'))
const CalendarPage = lazy(() => import('@/pages/CalendarPage'))
const Tables = lazy(() => import('@/pages/Tables'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const Forgot = lazy(() => import('@/pages/Forgot'))
const Help = lazy(() => import('@/pages/Help'))
const HelpArticle = lazy(() => import('@/pages/HelpArticle'))
const Pricing = lazy(() => import('@/pages/Pricing'))
const Components = lazy(() => import('@/pages/Components'))
const Settings = lazy(() => import('@/pages/Settings'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export function App() {
  return (
    <Suspense fallback={<div className="route-loading" aria-busy="true" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="markets" element={<Markets />} />
          <Route path="markets/:symbol" element={<Asset />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="tables" element={<Tables />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<Forgot />} />
          <Route path="help" element={<Help />} />
          <Route path="help/:slug" element={<HelpArticle />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="components" element={<Components />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
