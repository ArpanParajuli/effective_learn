import { Routes, Route, Navigate } from 'react-router-dom'
import { SubjectsPage } from '@/features/subjects/SubjectsPage'
import { SubjectDetailView } from '@/features/subjects/SubjectDetailView'
import { ChapterReaderPage } from '@/features/reader/ChapterReaderPage'
import { ChapterPresentationView } from '@/features/presentation/ChapterPresentationView'
import { ChapterEditorPage } from '@/features/editor/ChapterEditorPage'
import { KnowledgeGraphView } from '@/features/graph/KnowledgeGraphView'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<SubjectsPage />} />
      <Route path="/graph" element={<KnowledgeGraphView />} />
      <Route path="/subjects/:subjectId" element={<SubjectDetailView />} />
      <Route path="/read/:chapterId" element={<ChapterReaderPage />} />
      <Route path="/present/:chapterId" element={<ChapterPresentationView />} />
      <Route path="/write" element={<ChapterEditorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
