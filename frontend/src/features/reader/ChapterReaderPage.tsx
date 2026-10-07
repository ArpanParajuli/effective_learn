import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Calendar, Edit3, Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchChapterById, fetchChaptersBySubject } from '@/lib/api'
import { RichContentRenderer } from '@/components/content/RichContentRenderer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export function ChapterReaderPage() {
  const { chapterId } = useParams<{ chapterId: string }>()

  const { data: chapter, isLoading, error } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: () => (chapterId ? fetchChapterById(chapterId) : Promise.reject('No ID')),
    enabled: !!chapterId,
  })

  const { data: rawChapters = [] } = useQuery({
    queryKey: ['chapters', chapter?.subjectId],
    queryFn: () =>
      chapter?.subjectId ? fetchChaptersBySubject(chapter.subjectId) : Promise.resolve([]),
    enabled: !!chapter?.subjectId,
  })

  const chapters = Array.isArray(rawChapters) ? rawChapters : []
  const currentIndex = chapters.findIndex((c) => c.id === chapterId)
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Chapter link copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-44 w-full rounded-xl mt-4" />
          <Skeleton className="h-4 w-full mt-4" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (error || !chapter) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Chapter not found</p>
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Return to Subjects
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <article className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link
          to={`/subjects/${chapter.subjectId}`}
          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{chapter.subjectTitle || 'Back to Subject'}</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1 rounded-md px-2.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <Link to={`/write?chapterId=${chapter.id}&subjectId=${chapter.subjectId}`}>
            <button className="flex items-center gap-1 rounded-md px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </button>
          </Link>
        </div>
      </div>

      {/* Header Info */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{chapter.subjectTitle}</Badge>
          {currentIndex >= 0 && chapters.length > 0 && (
            <Badge variant="secondary" className="text-xs font-normal">
              Chapter {currentIndex + 1} of {chapters.length}
            </Badge>
          )}
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {chapter.estimatedMinutes} min read
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          {chapter.title}
        </h1>

        {chapter.summary && (
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            {chapter.summary}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-b border-slate-200 dark:border-slate-800 pb-6">
          <Calendar className="h-3.5 w-3.5" />
          <span>Published on {new Date(chapter.createdAtUtc).toLocaleDateString()}</span>
        </div>
      </header>

      {/* Rendered Chapter Content */}
      <div className="pt-2">
        <RichContentRenderer content={chapter.content} />
      </div>

      {/* Chapter Pagination / Adjacent Navigation */}
      <div className="mt-14 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevChapter ? (
            <Link
              to={`/read/${prevChapter.id}`}
              className="group flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all text-left bg-white dark:bg-[#11131a]"
            >
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:-translate-x-0.5 transition-transform shrink-0">
                <ChevronLeft className="h-4 w-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Previous Chapter
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {prevChapter.title}
                </p>
              </div>
            </Link>
          ) : (
            <div className="hidden sm:block" />
          )}

          {nextChapter ? (
            <Link
              to={`/read/${nextChapter.id}`}
              className="group flex items-center justify-end gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all text-right bg-white dark:bg-[#11131a]"
            >
              <div className="overflow-hidden text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Next Chapter
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {nextChapter.title}
                </p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:translate-x-0.5 transition-transform shrink-0">
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          ) : (
            <div className="hidden sm:block" />
          )}
        </div>

        {/* Bottom Utility Controls */}
        <div className="flex items-center justify-between pt-2">
          <Link to={`/subjects/${chapter.subjectId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Table of Contents
            </Button>
          </Link>
          <Link to={`/write?subjectId=${chapter.subjectId}`}>
            <Button size="sm">
              Write New Chapter
            </Button>
          </Link>
        </div>
      </div>
    </article>
  )
}
