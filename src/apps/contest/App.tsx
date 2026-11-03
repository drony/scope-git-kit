import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/apps/contest/layout/Layout'
import Home from '@/apps/contest/pages/Home'

// Everything except the home page is split into its own chunk.
const Play = lazy(() => import('@/apps/contest/pages/Play'))
const AdminLayout = lazy(() => import('@/apps/contest/pages/admin/AdminLayout'))
const Questions = lazy(() => import('@/apps/contest/pages/admin/Questions'))
const Review = lazy(() => import('@/apps/contest/pages/admin/Review'))
const Moderation = lazy(() => import('@/apps/contest/pages/admin/Moderation'))
const Versions = lazy(() => import('@/apps/contest/pages/admin/Versions'))
const Packs = lazy(() => import('@/apps/contest/pages/admin/Packs'))
const Audit = lazy(() => import('@/apps/contest/pages/admin/Audit'))
const MediaPage = lazy(() => import('@/apps/contest/pages/admin/MediaPage'))
const Announcements = lazy(() => import('@/apps/contest/pages/Announcements'))
const Communication = lazy(() => import('@/apps/contest/pages/admin/Communication'))
const LeaderboardPage = lazy(() => import('@/apps/contest/pages/Leaderboard'))
const Participants = lazy(() => import('@/apps/contest/pages/admin/Participants'))
const Submissions = lazy(() => import('@/apps/contest/pages/admin/Submissions'))
const Results = lazy(() => import('@/apps/contest/pages/admin/Results'))
const Components = lazy(() => import('@/apps/contest/pages/Components'))
const Weekly = lazy(() => import('@/apps/contest/pages/admin/Weekly'))
const Live = lazy(() => import('@/apps/contest/pages/Live'))
const Host = lazy(() => import('@/apps/contest/pages/admin/Host'))
const SurveyPage = lazy(() => import('@/apps/contest/pages/Survey'))
const Preferences = lazy(() => import('@/apps/contest/pages/Preferences'))
const Surveys = lazy(() => import('@/apps/contest/pages/admin/Surveys'))
const Settings = lazy(() => import('@/apps/contest/pages/Settings'))
const NotFound = lazy(() => import('@/apps/contest/pages/NotFound'))

export function App() {
  return (
    <Suspense fallback={<div className="route-loading" aria-busy="true" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="play" element={<Play />} />
          <Route path="live" element={<Live />} />
          <Route path="survey/:id" element={<SurveyPage />} />
          <Route path="preferences" element={<Preferences />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="questions" replace />} />
            <Route path="questions" element={<Questions />} />
            <Route path="review" element={<Review />} />
            <Route path="packs" element={<Packs />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="weekly" element={<Weekly />} />
            <Route path="host" element={<Host />} />
            <Route path="surveys" element={<Surveys />} />
            <Route path="participants" element={<Participants />} />
            <Route path="moderation" element={<Moderation />} />
            <Route path="versions" element={<Versions />} />
            <Route path="submissions" element={<Submissions />} />
            <Route path="communication" element={<Communication />} />
            <Route path="results" element={<Results />} />
            <Route path="audit" element={<Audit />} />
          </Route>
          <Route path="components" element={<Components />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
