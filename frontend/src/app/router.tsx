import { Routes, Route, Navigate } from 'react-router-dom'
import { SubjectsPage } from '@/features/subjects/SubjectsPage'
import { SubjectDetailView } from '@/features/subjects/SubjectDetailView'
import { ChapterReaderPage } from '@/features/reader/ChapterReaderPage'
import { ChapterEditorPage } from '@/features/editor/ChapterEditorPage'
import { AuthPage } from '@/features/auth/AuthPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<SubjectsPage />} />
      <Route path="/subjects/:subjectId" element={<SubjectDetailView />} />
      <Route path="/read/:chapterId" element={<ChapterReaderPage />} />
      <Route path="/write" element={<ChapterEditorPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
