import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/apps/finscope/layout/Layout'
import Home from '@/apps/finscope/pages/Home'

// Everything except the home page is split into its own chunk.
const Dashboard = lazy(() => import('@/apps/finscope/pages/Dashboard'))
const Markets = lazy(() => import('@/apps/finscope/pages/Markets'))
const Asset = lazy(() => import('@/apps/finscope/pages/Asset'))
const CalendarPage = lazy(() => import('@/apps/finscope/pages/CalendarPage'))
const Tables = lazy(() => import('@/apps/finscope/pages/Tables'))
const Login = lazy(() => import('@/apps/finscope/pages/Login'))
const Register = lazy(() => import('@/apps/finscope/pages/Register'))
const Forgot = lazy(() => import('@/apps/finscope/pages/Forgot'))
const Help = lazy(() => import('@/apps/finscope/pages/Help'))
const HelpArticle = lazy(() => import('@/apps/finscope/pages/HelpArticle'))
const Pricing = lazy(() => import('@/apps/finscope/pages/Pricing'))
const Components = lazy(() => import('@/apps/finscope/pages/Components'))
const Settings = lazy(() => import('@/apps/finscope/pages/Settings'))
const NotFound = lazy(() => import('@/apps/finscope/pages/NotFound'))

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
