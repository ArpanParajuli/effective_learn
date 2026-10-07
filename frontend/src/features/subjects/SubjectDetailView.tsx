import * as React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Clock, FileText, ChevronRight, Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchSubjects, fetchChaptersBySubject } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

export function SubjectDetailView() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const [chapterFilter, setChapterFilter] = React.useState('')

  const { data: rawSubjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  })

  const subjects = Array.isArray(rawSubjects) ? rawSubjects : []
  const subject = subjects.find((s) => s.id === subjectId)

  const { data: rawChapters = [], isLoading } = useQuery({
    queryKey: ['chapters', subjectId],
    queryFn: () => (subjectId ? fetchChaptersBySubject(subjectId) : Promise.resolve([])),
    enabled: !!subjectId,
  })

  const chapters = Array.isArray(rawChapters) ? rawChapters : []

  const filteredChapters = React.useMemo(() => {
    if (!chapterFilter.trim()) return chapters
    const q = chapterFilter.toLowerCase().trim()
    return chapters.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.summary && c.summary.toLowerCase().includes(q))
    )
  }, [chapters, chapterFilter])

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Table of Contents ({chapters.length})
          </h2>
          {chapters.length > 2 && (
            <div className="w-full sm:w-64">
              <InputGroup className="h-8">
                <InputGroupAddon placement="left" className="px-2">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Filter chapters..."
                  value={chapterFilter}
                  onChange={(e) => setChapterFilter(e.target.value)}
                  className="h-8 text-xs py-1"
                />
                {chapterFilter && (
                  <button
                    onClick={() => setChapterFilter('')}
                    className="pr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </InputGroup>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-5 w-2/3" />
                </div>
                <div className="pl-9 space-y-1.5">
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </Card>
            ))}
          </div>
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
        ) : filteredChapters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center space-y-2">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              No chapters match "{chapterFilter}"
            </p>
            <Button variant="outline" size="sm" onClick={() => setChapterFilter('')}>
              Clear Filter
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChapters.map((chapter, index) => (
              <Link
                key={chapter.id}
                to={`/read/${chapter.id}`}
                className="group block"
              >
                <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-all bg-white dark:bg-[#11131a]">
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
                          <Clock className="h-3 w-3" />
                          {chapter.estimatedMinutes} min read
                        </span>
                        <span>{new Date(chapter.createdAtUtc).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all mt-1" />
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
