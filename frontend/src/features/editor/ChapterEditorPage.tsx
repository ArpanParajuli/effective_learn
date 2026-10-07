import * as React from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Film, 
  Globe, 
  Link as LinkIcon, 
  Code, 
  Eye, 
  Edit3, 
  Columns, 
  Check, 
  Heading,
  List
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSubjects, fetchChapterById, createChapter, updateChapter } from '@/lib/api'
import { RichContentRenderer } from '@/components/content/RichContentRenderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export function ChapterEditorPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const preselectedSubjectId = searchParams.get('subjectId') || ''
  const editingChapterId = searchParams.get('chapterId') || ''

  const [subjectId, setSubjectId] = React.useState(preselectedSubjectId)
  const [title, setTitle] = React.useState('')
  const [summary, setSummary] = React.useState('')
  const [content, setContent] = React.useState('')
  const [viewMode, setViewMode] = React.useState<'write' | 'preview' | 'split'>('write')

  // Modals for inserting media
  const [showVideoModal, setShowVideoModal] = React.useState(false)
  const [videoUrl, setVideoUrl] = React.useState('')

  const [showWebsiteModal, setShowWebsiteModal] = React.useState(false)
  const [websiteUrl, setWebsiteUrl] = React.useState('')
  const [websiteTitle, setWebsiteTitle] = React.useState('')

  const [showLinkModal, setShowLinkModal] = React.useState(false)
  const [linkUrl, setLinkUrl] = React.useState('')
  const [linkText, setLinkText] = React.useState('')

  // Load subjects
  const { data: rawSubjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  })
  const subjects = Array.isArray(rawSubjects) ? rawSubjects : []

  // Set default subject if not yet set
  React.useEffect(() => {
    if (!subjectId && subjects.length > 0) {
      setSubjectId(preselectedSubjectId || subjects[0].id)
    }
  }, [subjects, subjectId, preselectedSubjectId])

  // Load existing chapter if editing
  const { data: existingChapter } = useQuery({
    queryKey: ['chapter', editingChapterId],
    queryFn: () => fetchChapterById(editingChapterId),
    enabled: !!editingChapterId,
  })

  React.useEffect(() => {
    if (existingChapter) {
      setTitle(existingChapter.title)
      setSummary(existingChapter.summary)
      setContent(existingChapter.content)
      setSubjectId(existingChapter.subjectId)
    }
  }, [existingChapter])

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const insertTextAtCursor = (insertion: string) => {
    if (!textareaRef.current) {
      setContent((prev) => prev + '\n' + insertion)
      return
    }
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = content.substring(0, start)
    const after = content.substring(end)
    const newContent = before + insertion + after
    setContent(newContent)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + insertion.length, start + insertion.length)
    }, 50)
  }

  // Insert Handlers
  const handleInsertVideo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoUrl.trim()) return
    insertTextAtCursor(`\n\n[video:${videoUrl.trim()}]\n\n`)
    setVideoUrl('')
    setShowVideoModal(false)
    toast.success('Video embed tag inserted!')
  }

  const handleInsertWebsite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!websiteUrl.trim()) return
    const tag = websiteTitle.trim()
      ? `\n\n[website:${websiteUrl.trim()}|${websiteTitle.trim()}]\n\n`
      : `\n\n[website:${websiteUrl.trim()}]\n\n`
    insertTextAtCursor(tag)
    setWebsiteUrl('')
    setWebsiteTitle('')
    setShowWebsiteModal(false)
    toast.success('Website preview bookmark inserted!')
  }

  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkUrl.trim()) return
    const text = linkText.trim() || linkUrl.trim()
    insertTextAtCursor(`[${text}](${linkUrl.trim()})`)
    setLinkUrl('')
    setLinkText('')
    setShowLinkModal(false)
    toast.success('Link inserted!')
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingChapterId) {
        await updateChapter({
          id: editingChapterId,
          title: title.trim(),
          summary: summary.trim(),
          content: content.trim(),
          orderIndex: existingChapter?.orderIndex || 1,
          estimatedMinutes: Math.max(1, Math.round(content.split(' ').length / 180)),
          isPublished: true,
        })
        return editingChapterId
      } else {
        return await createChapter({
          subjectId,
          title: title.trim(),
          summary: summary.trim(),
          content: content.trim(),
          orderIndex: 1,
          estimatedMinutes: Math.max(1, Math.round(content.split(' ').length / 180)),
          isPublished: true,
        })
      }
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      toast.success(editingChapterId ? 'Chapter updated successfully!' : 'Chapter published!')
      navigate(`/read/${id}`)
    },
    onError: () => {
      toast.error('Failed to save chapter.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectId) {
      toast.error('Please select a subject category')
      return
    }
    if (!title.trim()) {
      toast.error('Chapter title is required')
      return
    }
    if (!content.trim()) {
      toast.error('Please write some content or insert a video/link')
      return
    }
    saveMutation.mutate()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          {/* View Mode Buttons */}
          <div className="hidden sm:flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('write')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                viewMode === 'write'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Edit3 className="h-3 w-3" /> Write
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="h-3 w-3" /> Preview
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns className="h-3 w-3" /> Split
            </button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="gap-1.5"
          >
            <Check className="h-4 w-4" />
            {saveMutation.isPending ? 'Publishing...' : editingChapterId ? 'Save Changes' : 'Publish Chapter'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject Category Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subject Category
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              required
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Chapter Title
            </label>
            <Input
              placeholder="e.g. 1. Clean Architecture Deep Dive"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Summary / Brief Excerpt
          </label>
          <Input
            placeholder="A short description of what is explained in this chapter..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        {/* Media & Embed Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-1.5 text-xs">
          <span className="text-[11px] font-semibold uppercase text-slate-400 px-2">
            Insert Embeds:
          </span>

          <button
            type="button"
            onClick={() => setShowVideoModal(true)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            <Film className="h-3.5 w-3.5 text-indigo-500" />
            <span>Video Lecture</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWebsiteModal(true)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            <Globe className="h-3.5 w-3.5 text-emerald-500" />
            <span>Website Card</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            <LinkIcon className="h-3.5 w-3.5 text-blue-500" />
            <span>Hyperlink</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={() => insertTextAtCursor('\n\n```csharp\n// Insert code here\n```\n\n')}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Code className="h-3.5 w-3.5" /> Code
          </button>

          <button
            type="button"
            onClick={() => insertTextAtCursor('\n\n## Section Title\n\n')}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Heading className="h-3.5 w-3.5" /> Heading
          </button>

          <button
            type="button"
            onClick={() => insertTextAtCursor('\n- Point 1\n- Point 2\n')}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <List className="h-3.5 w-3.5" /> Bullet
          </button>
        </div>

        {/* Writing Canvas / Split View */}
        <div className="grid grid-cols-1 gap-6">
          {viewMode === 'write' && (
            <div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                placeholder="Write your chapter content here. You can use Markdown, insert links, or click the buttons above to embed videos and websites in between your paragraphs..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-4 text-base font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-y leading-relaxed"
                required
              />
            </div>
          )}

          {viewMode === 'preview' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 min-h-[400px]">
              <h2 className="text-2xl font-bold mb-4">{title || 'Untitled Chapter Preview'}</h2>
              <RichContentRenderer content={content || '*No content written yet.*'} />
            </div>
          )}

          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  placeholder="Writing canvas..."
                  className="w-full h-full min-h-[450px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-4 text-sm font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-y leading-relaxed"
                  required
                />
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 max-h-[600px] overflow-y-auto">
                <h3 className="text-xl font-bold mb-3">{title || 'Preview'}</h3>
                <RichContentRenderer content={content || '*Live preview appears here...*'} />
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Insert Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <Film className="h-5 w-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Insert Video Lecture
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter any YouTube video link or direct MP4 URL to embed a responsive video player right inside the article.
            </p>
            <form onSubmit={handleInsertVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Video URL
                </label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVideoModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Insert Video</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insert Website Modal */}
      {showWebsiteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-5 w-5 text-emerald-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Insert Website Bookmark
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add a rich preview card for external documentation, RFC specs, or articles.
            </p>
            <form onSubmit={handleInsertWebsite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Website URL
                </label>
                <Input
                  placeholder="https://learn.microsoft.com/..."
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Card Title / Label (Optional)
                </label>
                <Input
                  placeholder="e.g. Official Documentation"
                  value={websiteTitle}
                  onChange={(e) => setWebsiteTitle(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWebsiteModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Insert Bookmark</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insert Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <LinkIcon className="h-5 w-5 text-blue-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Insert Link
              </h3>
            </div>
            <form onSubmit={handleInsertLink} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Link Text
                </label>
                <Input
                  placeholder="e.g. Read the specification"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target URL
                </label>
                <Input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLinkModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Insert Link</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
