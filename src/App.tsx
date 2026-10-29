import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/demo/layout/Layout'
import Home from '@/demo/pages/Home'

// Everything except the home page is split into its own chunk.
const Dashboard = lazy(() => import('@/demo/pages/Dashboard'))
const Markets = lazy(() => import('@/demo/pages/Markets'))
const Asset = lazy(() => import('@/demo/pages/Asset'))
const CalendarPage = lazy(() => import('@/demo/pages/CalendarPage'))
const Tables = lazy(() => import('@/demo/pages/Tables'))
const Login = lazy(() => import('@/demo/pages/Login'))
const Register = lazy(() => import('@/demo/pages/Register'))
const Forgot = lazy(() => import('@/demo/pages/Forgot'))
const Help = lazy(() => import('@/demo/pages/Help'))
const HelpArticle = lazy(() => import('@/demo/pages/HelpArticle'))
const Pricing = lazy(() => import('@/demo/pages/Pricing'))
const Components = lazy(() => import('@/demo/pages/Components'))
const Settings = lazy(() => import('@/demo/pages/Settings'))
const NotFound = lazy(() => import('@/demo/pages/NotFound'))

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
