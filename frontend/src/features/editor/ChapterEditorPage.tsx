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
  Save,
  Copy,
  Check,
  FolderOpen,
  FileCode2,
  BookOpen,
  FileText,
  Type,
  X,
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
  const [cursorPos, setCursorPos] = React.useState({ line: 1, col: 1 })
  const [copiedMarkdown, setCopiedMarkdown] = React.useState(false)
  const [isDirty, setIsDirty] = React.useState(false)

  // Custom typography preferences: Mono, Sans, or Serif font + size control
  const [editorFont, setEditorFont] = React.useState<'mono' | 'sans' | 'serif'>('mono')
  const [editorFontSize, setEditorFontSize] = React.useState<number>(14)

  // Smooth typing: Deferred content for live preview so 120 FPS typing never stutters
  const deferredContent = React.useDeferredValue(content)

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
  const currentSubject = subjects.find((s) => s.id === subjectId)

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
      setIsDirty(false)
    }
  }, [existingChapter])

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-extract title from markdown if not manually overridden
  const extractedTitle = React.useMemo(() => {
    if (!content) return ''
    const lines = content.split('\n')
    for (const raw of lines) {
      const trimmed = raw.trim()
      if (trimmed.startsWith('# ')) {
        return trimmed.replace(/^#\s+/, '').trim()
      }
    }
    for (const raw of lines) {
      const trimmed = raw.trim()
      if (trimmed && !trimmed.startsWith('```') && !trimmed.startsWith('![') && !trimmed.startsWith('>')) {
        return trimmed.replace(/^[#\-*]\s*/, '').slice(0, 100).trim()
      }
    }
    return ''
  }, [content])

  // Auto-extract summary from first non-heading paragraph under title
  const extractedSummary = React.useMemo(() => {
    if (!content) return ''
    const lines = content.split('\n')
    let foundTitle = false
    for (const raw of lines) {
      const trimmed = raw.trim()
      if (trimmed.startsWith('# ')) {
        foundTitle = true
        continue
      }
      if (
        foundTitle &&
        trimmed &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('```') &&
        !trimmed.startsWith('![') &&
        !trimmed.startsWith('>')
      ) {
        return trimmed.slice(0, 200).trim()
      }
    }
    return ''
  }, [content])

  // Statistics
  const wordCount = React.useMemo(() => {
    return content.trim() ? content.trim().split(/\s+/).length : 0
  }, [content])

  const estimatedMinutes = React.useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 180))
  }, [wordCount])

  // Update cursor position
  const handleCursorActivity = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    const start = target.selectionStart
    const lines = target.value.substring(0, start).split('\n')
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    })
  }

  // Smart Insert / Toggle Text at Cursor
  const insertTextAtCursor = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) {
      setContent((prev) => prev + '\n' + prefix + defaultText + suffix)
      setIsDirty(true)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const hasSelection = start !== end
    const selected = hasSelection ? content.substring(start, end) : defaultText

    // Check if selected text is already wrapped in prefix & suffix (toggle off)
    if (hasSelection && suffix && selected.startsWith(prefix) && selected.endsWith(suffix)) {
      const unwrapped = selected.slice(prefix.length, -suffix.length)
      const before = content.substring(0, start)
      const after = content.substring(end)
      setContent(before + unwrapped + after)
      setIsDirty(true)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start, start + unwrapped.length)
      }, 10)
      return
    }

    const replacement = prefix + selected + suffix
    const before = content.substring(0, start)
    const after = content.substring(end)

    setContent(before + replacement + after)
    setIsDirty(true)

    setTimeout(() => {
      textarea.focus()
      if (!hasSelection && defaultText) {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + defaultText.length)
      } else {
        const newCursorPos = start + replacement.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 10)
  }

  // Smooth keyboard handling: Tab indentation, shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key: insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + '  ' + content.substring(end)
      setContent(newContent)
      setIsDirty(true)
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

  // Copy Markdown to Clipboard
  const handleCopyMarkdown = () => {
    if (!content) return
    navigator.clipboard.writeText(content)
    setCopiedMarkdown(true)
    toast.success('Markdown copied to clipboard!')
    setTimeout(() => setCopiedMarkdown(false), 2000)
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
      setIsDirty(false)
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
      setIsDirty(false)
      toast.success('Chapter updated successfully!')
      navigate(`/read/${editingChapterId}`)
    },
    onError: () => toast.error('Failed to update chapter.'),
  })

  const handleSave = () => {
    const finalTitle = (title.trim() || extractedTitle || '').trim()
    if (!finalTitle) {
      toast.error('Please write a chapter title (e.g. # Chapter Title) in your Markdown document.')
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

    const finalSummary = summary.trim() || extractedSummary

    if (editingChapterId) {
      updateMutation.mutate({
        id: editingChapterId,
        title: finalTitle,
        summary: finalSummary,
        content: content.trim(),
        orderIndex: existingChapter?.orderIndex || 1,
        estimatedMinutes,
        isPublished: true,
      })
    } else {
      createMutation.mutate({
        subjectId,
        title: finalTitle,
        summary: finalSummary,
        content: content.trim(),
        orderIndex: 1,
        estimatedMinutes,
        isPublished: true,
      })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] min-h-[620px] max-w-7xl mx-auto space-y-2.5">
      {/* Top Header Row: Back, Subject, Document Title, Telemetry, Mode Controller, Publish */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link
            to={subjectId ? `/subjects/${subjectId}` : '/'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to Subject"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Clean Subject Category Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11131a] text-xs">
            <FolderOpen className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Subject:
            </span>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value)
                setIsDirty(true)
              }}
              className="bg-transparent font-semibold text-slate-900 dark:text-white border-0 py-0 pl-1 pr-2 text-xs focus:outline-hidden cursor-pointer"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="dark:bg-[#11131a] text-slate-900 dark:text-white">
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Document Title Breadcrumb & Quick Rename */}
          <div className="flex items-center gap-1.5 max-w-[200px] sm:max-w-[320px]">
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline select-none">/</span>
            <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden sm:inline" />
            <input
              type="text"
              value={title || extractedTitle}
              onChange={(e) => {
                setTitle(e.target.value)
                setIsDirty(true)
              }}
              placeholder="Untitled Chapter"
              title="Chapter Title (auto-synced with # Heading in Markdown)"
              className="bg-transparent font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-hidden transition-colors truncate px-1 py-0.5"
            />
          </div>

          {/* Live Document Telemetry */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400">
              <span>{wordCount} words</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>~{estimatedMinutes}m read</span>
            </div>

            {isDirty ? (
              <span className="flex items-center gap-1.5 text-[11px] text-amber-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Unsaved
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Synced
              </span>
            )}
          </div>
        </div>

        {/* View Switcher & Publish Button */}
        <div className="flex items-center gap-2">
          {/* Segmented Mode Control */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#11131a] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('write')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                viewMode === 'write'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="gap-1.5 h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>
              {isSaving
                ? 'Saving...'
                : editingChapterId
                ? 'Save Edits'
                : 'Publish'}
            </span>
            <kbd className="hidden sm:inline-block ml-0.5 px-1 py-0.2 bg-indigo-750/70 text-[10px] rounded font-mono text-indigo-200">
              Ctrl+S
            </kbd>
          </Button>
        </div>
      </div>

      {/* Docked Formatting Toolbar */}
      <div className="shrink-0 bg-slate-50/90 dark:bg-[#11131a]/90 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1 overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0">
          {/* Headings */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => insertTextAtCursor('\n# ', '\n', 'Heading 1')}
              title="Heading 1"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Heading1 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('\n## ', '\n', 'Heading 2')}
              title="Heading 2"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Heading2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('\n### ', '\n', 'Heading 3')}
              title="Heading 3"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Heading3 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Typography */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => insertTextAtCursor('**', '**', 'bold text')}
              title="Bold (Ctrl+B)"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('*', '*', 'italic text')}
              title="Italic (Ctrl+I)"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('~~', '~~', 'strikethrough')}
              title="Strikethrough"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('`', '`', 'inlineCode')}
              title="Inline Code"
              className="px-1.5 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs font-mono font-semibold"
            >
              {'</>'}
            </button>
          </div>

          {/* Media Blocks */}
          <div className="flex items-center gap-1 px-1 border-r border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              title="Insert Syntax-Highlighted Code Block"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Code className="h-3.5 w-3.5 text-indigo-500" />
              <span>Code</span>
            </button>

            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              title="Insert Image / Diagram"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
              <span>Image</span>
            </button>

            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              title="Embed Video Lecture"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Film className="h-3.5 w-3.5 text-rose-500" />
              <span>Video</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWebsiteModal(true)}
              title="Insert Website Preview Bookmark"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 text-sky-500" />
              <span>Bookmark</span>
            </button>
          </div>

          {/* Callouts, Lists, Tables */}
          <div className="flex items-center gap-0.5 pl-1">
            <button
              type="button"
              onClick={() =>
                insertTextAtCursor(
                  '\n> [!NOTE]\n> ',
                  '\n\n',
                  'Important note or key takeaway here.'
                )
              }
              title="Obsidian Callout Box"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Quote className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('\n- ', '\n', 'Bullet point')}
              title="Bullet List"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('\n1. ', '\n', 'Step one')}
              title="Numbered List"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                insertTextAtCursor(
                  '\n| Concept | Architectural Role | Status |\n| :--- | :--- | :--- |\n| Clean Architecture | Decouples domain core from external infra | Verified |\n| PostgreSQL 17 | Relational persistence with BRIN partitioning | Active |\n| Prism Engine | Multi-language syntax highlighting | Complete |\n\n'
                )
              }
              title="Insert Markdown Table"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <TableIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('\n---\n\n')}
              title="Horizontal Divider"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Action: Font Selector & Copy Source */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Custom Font Picker */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 text-xs">
            <Type className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <select
              value={editorFont}
              onChange={(e) => setEditorFont(e.target.value as any)}
              className="bg-transparent text-[11px] font-medium text-slate-800 dark:text-slate-200 border-0 py-0 pl-0 pr-1 focus:outline-hidden cursor-pointer"
            >
              <option value="mono" className="dark:bg-[#11131a]">Mono (Code)</option>
              <option value="sans" className="dark:bg-[#11131a]">Sans (Clean)</option>
              <option value="serif" className="dark:bg-[#11131a]">Serif (Book)</option>
            </select>
            <div className="flex items-center gap-0.5 pl-1 border-l border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 font-mono">
              <button
                type="button"
                onClick={() => setEditorFontSize((s) => Math.max(12, s - 1))}
                title="Decrease font size"
                className="px-1 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                -
              </button>
              <span className="w-3 text-center">{editorFontSize}</span>
              <button
                type="button"
                onClick={() => setEditorFontSize((s) => Math.min(22, s + 1))}
                title="Increase font size"
                className="px-1 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            title="Copy Raw Markdown"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {copiedMarkdown ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[11px] text-emerald-500 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[11px]">Copy Source</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor & Preview Workspace: Exact flex-1 height with independent inner scroll */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Editor Pane */}
        {(viewMode === 'write' || viewMode === 'split') && (
          <div
            className={`flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c0d12] shadow-2xs overflow-hidden ${
              viewMode === 'write' ? 'md:col-span-2' : ''
            }`}
          >
            {/* Editor Pane Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-4 py-2 bg-slate-50/70 dark:bg-[#11131a] text-xs text-slate-500 dark:text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-3.5 w-3.5 text-indigo-500" />
                <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
                  Markdown Canvas
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({editorFont} • {editorFontSize}px)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span>Tab indents 2 spaces</span>
                <span>•</span>
                <span>Ctrl+B Bold</span>
                <span>•</span>
                <span>Ctrl+S Save</span>
              </div>
            </div>

            {/* Smooth Textarea with internal scroll, custom font, and smooth caret */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setIsDirty(true)
              }}
              onKeyDown={handleKeyDown}
              onKeyUp={handleCursorActivity}
              onClick={handleCursorActivity}
              placeholder={`# 1. Clean Architecture & Boundaries\n\nWrite your concepts, explanations, architecture notes, and code here directly in Markdown...\n\n### Core Principles\n- Decouple domain core from external infrastructure\n- Enforce unidirectional dependencies\n\n### Code Demonstration\n\`\`\`csharp\npublic class CleanArchitecture\n{\n    // Domain logic core\n}\n\`\`\`\n\n| Layer | Responsibility | Status |\n| :--- | :--- | :--- |\n| Domain | Enterprise business rules | Core |\n| Infrastructure | External persistence & HTTP | Boundary |\n\n### Technical Diagram\n![Architecture Diagram](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800)\n\n### Video Lecture\n[video:https://www.youtube.com/watch?v=d_k8k04nK_c]\n`}
              className={`flex-1 min-h-0 w-full p-4 sm:p-5 leading-relaxed bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400/50 dark:placeholder:text-slate-600 focus:outline-hidden resize-none overflow-y-auto editor-canvas selection:bg-indigo-500/20 ${
                editorFont === 'mono'
                  ? 'font-canvas-mono'
                  : editorFont === 'sans'
                  ? 'font-canvas-sans'
                  : 'font-canvas-serif'
              }`}
              style={{ fontSize: `${editorFontSize}px` }}
            />

            {/* Status Footer Bar */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 px-4 py-1.5 bg-slate-50/50 dark:bg-[#0c0d12] text-[11px] text-slate-400 shrink-0">
              <div className="flex items-center gap-3">
                <span>
                  Ln {cursorPos.line}, Col {cursorPos.col}
                </span>
                <span>•</span>
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{content.length} chars</span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                UTF-8 • Markdown AST
              </div>
            </div>
          </div>
        )}

        {/* Live Article Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090a0f] shadow-2xs overflow-hidden ${
              viewMode === 'preview' ? 'md:col-span-2' : ''
            }`}
          >
            {/* Preview Pane Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-4 py-2 bg-slate-50/70 dark:bg-[#11131a] text-xs text-slate-500 dark:text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
                  Live Article Preview
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Synchronized</span>
              </div>
            </div>

            {/* Preview Content Body: Dedicated inner smooth scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6">
              {/* Optional Subject Pill */}
              {currentSubject && (
                <div className="mb-4">
                  <Badge variant="outline" className="text-xs font-semibold border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20">
                    {currentSubject.title}
                  </Badge>
                </div>
              )}

              {deferredContent.trim() ? (
                <RichContentRenderer content={deferredContent} />
              ) : (
                <div className="py-24 text-center space-y-3 text-slate-400">
                  <FileText className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.5]" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Your formatted article will render here in real-time
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                    Type directly in Markdown: headings, bold, italic, code blocks, tables, callouts, and media embeds.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Insert Image Dialog */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-emerald-500" />
                Integrate Image / Diagram
              </h3>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Embed architecture diagrams, flowcharts, or system schematics via direct URL.
            </p>
            <form onSubmit={handleInsertImage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Image Direct URL
                </label>
                <Input
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Caption / Alt Description
                </label>
                <Input
                  placeholder="e.g. Distributed Database Topology Diagram"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
              </div>

              {imageUrl && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-900/60 max-h-40 overflow-hidden">
                  <p className="text-[10px] text-slate-400 mb-1">Live Image Preview:</p>
                  <img src={imageUrl} alt="preview" className="max-h-32 object-contain mx-auto rounded" />
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
                    setImageAlt('Cloud Datacenter Infrastructure & Nodes')
                  }}
                >
                  <ImageIcon className="h-3 w-3 mr-1" /> Use Sample
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code className="h-5 w-5 text-indigo-500" />
                Insert Code Block
              </h3>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleInsertCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Language Syntax Highlighting
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
                  Code Snippet (Optional)
                </label>
                <textarea
                  placeholder="// Paste or write initial code here..."
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Film className="h-5 w-5 text-rose-500" />
                Embed Video Lecture
              </h3>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleInsertVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  YouTube or Video URL
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-sky-500" />
                Insert Website Bookmark
              </h3>
              <button
                type="button"
                onClick={() => setShowWebsiteModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleInsertWebsite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination URL
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
                  Preview Title (Optional)
                </label>
                <Input
                  placeholder="e.g. Official Documentation & Architecture Specs"
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
