import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Clock, FileText, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchSubjects, fetchChaptersBySubject } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function SubjectDetailView() {
  const { subjectId } = useParams<{ subjectId: string }>()

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  })

  const subject = subjects.find((s) => s.id === subjectId)

  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['chapters', subjectId],
    queryFn: () => (subjectId ? fetchChaptersBySubject(subjectId) : Promise.resolve([])),
    enabled: !!subjectId,
  })

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Breadcrumb / Navigation */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to All Subjects
        </Link>
      </div>

      {/* Subject Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {subject?.title || 'Subject'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {subject?.description || 'Curated chapters and technical notes.'}
          </p>
        </div>
        <Link to={`/write?subjectId=${subjectId}`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Chapter
          </Button>
        </Link>
      </div>

      {/* Chapters Listing */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Table of Contents ({chapters.length})
        </h2>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-slate-400">Loading chapters...</div>
        ) : chapters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center">
            <FileText className="h-7 w-7 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No chapters written yet</p>
            <p className="text-xs text-slate-500 mt-1">Be the first to add a learning chapter in this subject.</p>
            <Link to={`/write?subjectId=${subjectId}`}>
              <Button size="sm" className="mt-4">
                Write First Chapter
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter, index) => (
              <Link
                key={chapter.id}
                to={`/read/${chapter.id}`}
                className="group block"
              >
                <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {index + 1}
                        </span>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {chapter.title}
                        </h3>
                      </div>
                      {chapter.summary && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 pl-8 line-clamp-2">
                          {chapter.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-4 pl-8 pt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {chapter.estimatedMinutes} min read
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-center text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">
                      <span className="text-xs font-medium hidden sm:inline">Read</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
