import { Routes, Route, Navigate } from 'react-router-dom'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { DecksPage } from '@/features/decks/DecksPage'
import { StudyPage } from '@/features/study/StudyPage'
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<OverviewPage />} />
      <Route path="/decks" element={<DecksPage />} />
      <Route path="/study" element={<StudyPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
