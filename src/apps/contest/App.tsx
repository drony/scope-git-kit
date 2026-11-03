import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/apps/contest/layout/Layout'
import Home from '@/apps/contest/pages/Home'

// Everything except the home page is split into its own chunk.
const Play = lazy(() => import('@/apps/contest/pages/Play'))
const AdminLayout = lazy(() => import('@/apps/contest/pages/admin/AdminLayout'))
const Questions = lazy(() => import('@/apps/contest/pages/admin/Questions'))
const MediaPage = lazy(() => import('@/apps/contest/pages/admin/MediaPage'))
const Announcements = lazy(() => import('@/apps/contest/pages/Announcements'))
const Communication = lazy(() => import('@/apps/contest/pages/admin/Communication'))
const LeaderboardPage = lazy(() => import('@/apps/contest/pages/Leaderboard'))
const Participants = lazy(() => import('@/apps/contest/pages/admin/Participants'))
const Submissions = lazy(() => import('@/apps/contest/pages/admin/Submissions'))
const Results = lazy(() => import('@/apps/contest/pages/admin/Results'))
const Components = lazy(() => import('@/apps/contest/pages/Components'))
const Settings = lazy(() => import('@/apps/contest/pages/Settings'))
const NotFound = lazy(() => import('@/apps/contest/pages/NotFound'))

export function App() {
  return (
    <Suspense fallback={<div className="route-loading" aria-busy="true" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="play" element={<Play />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="questions" replace />} />
            <Route path="questions" element={<Questions />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="participants" element={<Participants />} />
            <Route path="submissions" element={<Submissions />} />
            <Route path="communication" element={<Communication />} />
            <Route path="results" element={<Results />} />
          </Route>
          <Route path="components" element={<Components />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
