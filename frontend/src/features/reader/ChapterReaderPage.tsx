import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Calendar, Edit3, Share2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchChapterById } from '@/lib/api'
import { RichContentRenderer } from '@/components/content/RichContentRenderer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export function ChapterReaderPage() {
  const { chapterId } = useParams<{ chapterId: string }>()

  const { data: chapter, isLoading, error } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: () => (chapterId ? fetchChapterById(chapterId) : Promise.reject('No ID')),
    enabled: !!chapterId,
  })

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Chapter link copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center text-sm text-slate-400">
        Loading article and video lectures...
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
        <div className="flex items-center gap-2">
          <Badge variant="outline">{chapter.subjectTitle}</Badge>
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

      {/* Bottom Completion Block */}
      <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <Link to={`/subjects/${chapter.subjectId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Table of Contents
          </Button>
        </Link>
        <Link to={`/write?subjectId=${chapter.subjectId}`}>
          <Button size="sm">
            Write Next Chapter
          </Button>
        </Link>
      </div>
    </article>
  )
}
