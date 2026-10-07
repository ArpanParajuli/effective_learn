import * as React from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Film,
  Globe,
  Image as ImageIcon,
  Code,
  Eye,
  Edit3,
  Columns,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Minus,
  Sparkles,
  Save,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSubjects, fetchChapterById, createChapter, updateChapter } from '@/lib/api'
import { RichContentRenderer } from '@/components/content/RichContentRenderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const PROGRAMMING_LANGUAGES = [
  { value: 'csharp', label: 'C# / .NET' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'PostgreSQL / SQL' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML / Docker' },
  { value: 'css', label: 'CSS / Tailwind' },
]

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
  const [viewMode, setViewMode] = React.useState<'write' | 'preview' | 'split'>('split')

  // Modals for inserting media & code
  const [showImageModal, setShowImageModal] = React.useState(false)
  const [imageUrl, setImageUrl] = React.useState('')
  const [imageAlt, setImageAlt] = React.useState('')

  const [showCodeModal, setShowCodeModal] = React.useState(false)
  const [codeLanguage, setCodeLanguage] = React.useState('csharp')
  const [codeSnippet, setCodeSnippet] = React.useState('')

  const [showVideoModal, setShowVideoModal] = React.useState(false)
  const [videoUrl, setVideoUrl] = React.useState('')

  const [showWebsiteModal, setShowWebsiteModal] = React.useState(false)
  const [websiteUrl, setWebsiteUrl] = React.useState('')
  const [websiteTitle, setWebsiteTitle] = React.useState('')

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

  // Statistics
  const wordCount = React.useMemo(() => {
    return content.trim() ? content.trim().split(/\s+/).length : 0
  }, [content])

  const estimatedMinutes = React.useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 180))
  }, [wordCount])

  // Insert Text at Cursor
  const insertTextAtCursor = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) {
      setContent((prev) => prev + '\n' + prefix + defaultText + suffix)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end) || defaultText

    const replacement = prefix + selected + suffix
    const before = content.substring(0, start)
    const after = content.substring(end)

    setContent(before + replacement + after)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + prefix.length + selected.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 50)
  }

  // Handle Tab key for indentation inside editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + '  ' + content.substring(end)
      setContent(newContent)
      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2)
      }, 10)
    }

    // Ctrl+S / Cmd+S save shortcut
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }

    // Ctrl+B bold shortcut
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      insertTextAtCursor('**', '**', 'bold text')
    }

    // Ctrl+I italic shortcut
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      insertTextAtCursor('*', '*', 'italic text')
    }
  }

  // Insert Handlers
  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl.trim()) return
    const altText = imageAlt.trim() || 'Architecture diagram'
    insertTextAtCursor(`\n\n![${altText}](${imageUrl.trim()})\n\n`)
    setImageUrl('')
    setImageAlt('')
    setShowImageModal(false)
    toast.success('Image integrated!')
  }

  const handleInsertCode = (e: React.FormEvent) => {
    e.preventDefault()
    const snippet = codeSnippet.trim() || '// Write your code here'
    insertTextAtCursor(`\n\n\`\`\`${codeLanguage}\n${snippet}\n\`\`\`\n\n`)
    setCodeSnippet('')
    setShowCodeModal(false)
    toast.success(`${codeLanguage.toUpperCase()} code block inserted!`)
  }

  const handleInsertVideo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoUrl.trim()) return
    insertTextAtCursor(`\n\n[video:${videoUrl.trim()}]\n\n`)
    setVideoUrl('')
    setShowVideoModal(false)
    toast.success('Video lecture embedded!')
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: createChapter,
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      queryClient.invalidateQueries({ queryKey: ['all-chapters'] })
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      toast.success('Chapter published successfully!')
      navigate(`/read/${newId}`)
    },
    onError: () => toast.error('Failed to create chapter.'),
  })

  const updateMutation = useMutation({
    mutationFn: updateChapter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter', editingChapterId] })
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      queryClient.invalidateQueries({ queryKey: ['all-chapters'] })
      toast.success('Chapter updated successfully!')
      navigate(`/read/${editingChapterId}`)
    },
    onError: () => toast.error('Failed to update chapter.'),
  })

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Please enter a chapter title.')
      return
    }
    if (!subjectId) {
      toast.error('Please select a subject category.')
      return
    }
    if (!content.trim()) {
      toast.error('Chapter content cannot be empty.')
      return
    }

    if (editingChapterId) {
      updateMutation.mutate({
        id: editingChapterId,
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        orderIndex: existingChapter?.orderIndex || 1,
        estimatedMinutes,
        isPublished: true,
      })
    } else {
      createMutation.mutate({
        subjectId,
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        orderIndex: 1,
        estimatedMinutes,
        isPublished: true,
      })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to={subjectId ? `/subjects/${subjectId}` : '/'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{editingChapterId ? 'Edit Article' : 'Authoring Studio'}</span>
              <Badge variant="outline" className="text-[10px] font-normal">
                {wordCount} words • ~{estimatedMinutes}m read
              </Badge>
            </h1>
          </div>
        </div>

        {/* View Switcher & Publish Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 p-0.5">
            <button
              onClick={() => setViewMode('write')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'write'
                  ? 'bg-white dark:bg-[#11131a] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Write</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-[#11131a] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-[#11131a] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Publishing...' : editingChapterId ? 'Save Edits' : 'Publish Chapter'}</span>
          </Button>
        </div>
      </div>

      {/* Chapter Metadata Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-[#11131a]/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Chapter Title
          </label>
          <Input
            placeholder="e.g. 1. Clean Architecture & Dependency Inversion"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-medium text-base bg-white dark:bg-[#090a0f]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Subject Category
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090a0f] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-slate-400"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 md:col-span-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Brief Summary / Takeaway (Optional)
          </label>
          <Input
            placeholder="A single concise sentence summarizing the core concepts learned..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="text-xs bg-white dark:bg-[#090a0f]"
          />
        </div>
      </div>

      {/* Obsidian-Style Interactive Formatting Ribbon */}
      <div className="flex items-center flex-wrap gap-1 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#11131a]/80 backdrop-blur-md">
        {/* Headings */}
        <button
          onClick={() => insertTextAtCursor('\n# ', '\n', 'Heading 1')}
          title="Heading 1"
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertTextAtCursor('\n## ', '\n', 'Heading 2')}
          title="Heading 2"
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertTextAtCursor('\n### ', '\n', 'Heading 3')}
          title="Heading 3"
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Text Styles */}
        <button
          onClick={() => insertTextAtCursor('**', '**', 'bold text')}
          title="Bold (Ctrl+B)"
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertTextAtCursor('*', '*', 'italic text')}
          title="Italic (Ctrl+I)"
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertTextAtCursor('~~', '~~', 'strikethrough')}
          title="Strikethrough"
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertTextAtCursor('`', '`', 'inlineCode')}
          title="Inline Code"
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs font-mono"
        >
          {'</>'}
        </button>

        <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Rich Media: Code, Image, Video, Bookmark */}
        <button
          onClick={() => setShowCodeModal(true)}
          title="Insert Syntax-Highlighted Code Block"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
        >
          <Code className="h-4 w-4" />
          <span>Code Block</span>
        </button>

        <button
          onClick={() => setShowImageModal(true)}
          title="Insert Technical Diagram / Image"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
        >
          <ImageIcon className="h-4 w-4" />
          <span>Image</span>
        </button>

        <button
          onClick={() => setShowVideoModal(true)}
          title="Embed YouTube or MP4 Video Lecture"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Film className="h-4 w-4 text-rose-500" />
          <span>Video</span>
        </button>

        <button
          onClick={() => setShowWebsiteModal(true)}
          title="Insert Website Preview Bookmark"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Globe className="h-4 w-4 text-sky-500" />
          <span>Bookmark</span>
        </button>

        <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Obsidian Callouts & Lists */}
        <button
          onClick={() => insertTextAtCursor('\n> [!NOTE]\n> ', '\n\n', 'Important note or architectural takeaway here.')}
          title="Obsidian Callout Box"
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertTextAtCursor('\n- ', '\n', 'Bullet item')}
          title="Bullet List"
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertTextAtCursor('\n1. ', '\n', 'Step one')}
          title="Numbered List"
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertTextAtCursor('\n| Column 1 | Column 2 |\n| --- | --- |\n| Data A | Data B |\n\n')}
          title="Insert Table"
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <TableIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertTextAtCursor('\n---\n\n')}
          title="Horizontal Rule"
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {/* Editor & Preview Split Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[580px]">
        {/* Editor Side */}
        {(viewMode === 'write' || viewMode === 'split') && (
          <div
            className={`flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c0d12] shadow-sm overflow-hidden ${
              viewMode === 'write' ? 'md:col-span-2' : ''
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-2 bg-slate-50/50 dark:bg-[#11131a] text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Markdown Canvas
              </span>
              <span>Press Tab for 2-space indentation • Ctrl+B for Bold</span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`# Your Title\n\nWrite your concepts, lecture notes, or explanations here...\n\n### Code Demonstration\n\`\`\`csharp\npublic class CleanArchitecture\n{\n    // Insert implementation\n}\n\`\`\`\n\n### Diagram\n![Architecture Diagram](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800)\n\n### Embedded Video Lecture\n[video:https://www.youtube.com/watch?v=yF9SwL0p0Y0]\n`}
              className="flex-1 w-full p-4 font-mono text-sm leading-relaxed bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden resize-none min-h-[520px]"
            />
          </div>
        )}

        {/* Live Synchronized Preview Side */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090a0f] shadow-sm overflow-hidden ${
              viewMode === 'preview' ? 'md:col-span-2' : ''
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-2 bg-slate-50/50 dark:bg-[#11131a] text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Live Preview Output
              </span>
              <span>Rich Media & Syntax Highlighting</span>
            </div>
            <div className="p-6 overflow-y-auto max-h-[700px] flex-1">
              {title && (
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                  {title}
                </h1>
              )}
              {summary && (
                <p className="text-xs text-slate-500 dark:text-slate-400 pb-4 mb-6 border-b border-slate-200 dark:border-slate-800 italic">
                  {summary}
                </p>
              )}
              {content.trim() ? (
                <RichContentRenderer content={content} />
              ) : (
                <div className="py-20 text-center text-sm text-slate-400 italic">
                  Live preview will format as you write your notes, insert images, or add code...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Insert Image Dialog */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-emerald-500" />
              Integrate Image / Diagram
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Embed architecture schematics, database diagrams, or illustrative technical screenshots.
            </p>
            <form onSubmit={handleInsertImage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Image URL
                </label>
                <Input
                  placeholder="https://example.com/diagram.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alt Text / Caption
                </label>
                <Input
                  placeholder="e.g. Microservices Event Bus Architecture"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
              </div>

              {imageUrl && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-900/60 max-h-40 overflow-hidden">
                  <p className="text-[10px] text-slate-400 mb-1">Preview:</p>
                  <img src={imageUrl} alt="preview" className="max-h-32 object-contain mx-auto" />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-500"
                  onClick={() => {
                    setImageUrl('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800')
                    setImageAlt('Distributed Cloud Datacenter Infrastructure')
                  }}
                >
                  <Sparkles className="h-3 w-3 text-amber-500 mr-1" /> Use Sample
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowImageModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Insert Image</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Insert Code Dialog */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code className="h-5 w-5 text-indigo-500" />
              Insert Syntax-Highlighted Code Block
            </h3>
            <form onSubmit={handleInsertCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Programming Language
                </label>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090a0f] px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  {PROGRAMMING_LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Code Snippet (Optional - or type in editor)
                </label>
                <textarea
                  placeholder="// Paste or type code here"
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  className="w-full h-36 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 font-mono text-xs focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCodeModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Insert Code Block</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Insert Video Dialog */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Film className="h-5 w-5 text-rose-500" />
              Embed Video Lecture
            </h3>
            <form onSubmit={handleInsertVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  YouTube or MP4 URL
                </label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required
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
                <Button type="submit">Embed Video</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Insert Website Bookmark Dialog */}
      {showWebsiteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-sky-500" />
              Insert Website Preview Bookmark
            </h3>
            <form onSubmit={handleInsertWebsite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Website URL
                </label>
                <Input
                  placeholder="https://learn.microsoft.com/..."
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Card Title (Optional)
                </label>
                <Input
                  placeholder="e.g. Official Microsoft Architecture Guide"
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
    </div>
  )
}
