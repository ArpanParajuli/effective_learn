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
  Copy,
  Check,
  FolderOpen,
  FileCode2,
  BookOpen,
  FileText,
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

const STARTER_TEMPLATES = [
  {
    title: 'Technical Deep-Dive',
    desc: 'System architecture, trade-offs, diagram, and core implementation.',
    content: `# Architecture Deep-Dive

An in-depth breakdown of architectural patterns, system boundaries, and resilience strategies.

> [!NOTE]
> High availability, bounded contexts, and graceful degradation are foundational tenets for distributed systems.

## 1. System Topology & Context
Describe the high-level architecture and how requests flow through each service layer.

### Architecture Diagram
![System Architecture Diagram](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800)

## 2. Core Implementation
Here is the core service abstraction implementing clean separation of concerns:

\`\`\`csharp
public interface IOrderProcessingPipeline
{
    Task<ProcessResult> ExecuteAsync(OrderPayload order, CancellationToken ct);
}

public class OrderProcessingPipeline : IOrderProcessingPipeline
{
    private readonly ILogger<OrderProcessingPipeline> _logger;

    public OrderProcessingPipeline(ILogger<OrderProcessingPipeline> logger)
    {
        _logger = logger;
    }

    public async Task<ProcessResult> ExecuteAsync(OrderPayload order, CancellationToken ct)
    {
        _logger.LogInformation("Processing order {OrderId}...", order.Id);
        await Task.Delay(50, ct);
        return ProcessResult.Success(order.Id);
    }
}
\`\`\`

## 3. Key Takeaways & Trade-offs
- Decouple compute boundaries using message queues.
- Optimize tail latencies (p99) rather than simple averages.

### Video Walkthrough
[video:https://www.youtube.com/watch?v=d_k8k04nK_c]
`,
  },
  {
    title: 'Hands-on Code Tutorial',
    desc: 'Practical guide with code snippets, tips, and step-by-step instructions.',
    content: `# Practical Code Tutorial

A hands-on, runnable guide covering implementation details, common pitfalls, and best practices.

## Prerequisites
- Node.js 22+ or .NET 10 SDK
- PostgreSQL 17

## Step 1: Initialize the Service Boundary
Define clear types and return contracts to ensure type safety across the application:

\`\`\`typescript
export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export async function executeQuery<T>(sql: string): Promise<ServiceResponse<T>> {
  try {
    const result = await db.query(sql)
    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
\`\`\`

> [!TIP]
> Always enforce strict return types and comprehensive error handling.

## Step 2: Verification & Testing
Run unit tests to verify the behavior under edge conditions:

\`\`\`bash
npm run test -- --coverage
\`\`\`
`,
  },
  {
    title: 'Video Lecture Notes',
    desc: 'Curated lecture breakdown with timestamps, video embed, and bookmarks.',
    content: `# Video Lecture Notes & Synthesis

Comprehensive breakdown and key concepts from the technical deep-dive lecture.

### Lecture Recording
[video:https://www.youtube.com/watch?v=5faMjKuB9bc]

## Core Concepts Covered
- **Horizontal Scaling**: Partitioning database workloads across nodes.
- **Cache Strategies**: Cache-aside vs Write-through architectures.

> [!WARNING]
> Cache invalidation can lead to thundering herd problems if TTLs are not staggered with jitter.

## Recommended Reading
Read the official design docs at [website:https://learn.microsoft.com/en-us/azure/architecture/|Cloud Architecture Center].
`,
  },
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

  // Modals for inserting media, code & templates
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

  const [showTemplateModal, setShowTemplateModal] = React.useState(false)

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

  // Smooth keyboard handling: Tab indentation & shortcuts
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

  const handleApplyTemplate = (templateContent: string, templateTitle: string) => {
    if (content.trim().length > 0) {
      if (!window.confirm('Applying this template will replace the current content in your editor. Continue?')) {
        return
      }
    }
    setContent(templateContent)
    if (!title.trim()) {
      setTitle(templateTitle)
    }
    setShowTemplateModal(false)
    toast.success(`"${templateTitle}" template loaded!`)
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to={subjectId ? `/subjects/${subjectId}` : '/'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {currentSubject?.title || 'Subjects'}
            </span>
            <span>/</span>
            <span className="text-slate-400 dark:text-slate-500">
              {editingChapterId ? 'Editing Article' : 'New Article'}
            </span>
            <Badge variant="outline" className="ml-1 text-[10px] font-normal py-0">
              {wordCount} words • ~{estimatedMinutes}m read
            </Badge>
          </div>
        </div>

        {/* View Switcher & Publish Button */}
        <div className="flex items-center gap-2 sm:gap-3">
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

          {/* Publish / Save Button */}
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-xs">
            <Save className="h-4 w-4" />
            <span>
              {isSaving
                ? 'Publishing...'
                : editingChapterId
                ? 'Save Edits'
                : 'Publish Chapter'}
            </span>
          </Button>
        </div>
      </div>

      {/* Notion-Style Clean Document Header (Seamless, Non-boxy) */}
      <div className="space-y-3 pt-2">
        {/* Subject Category Selector as sleek badge property */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11131a] text-xs text-slate-600 dark:text-slate-300">
            <FolderOpen className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-medium text-[11px] text-slate-400 uppercase tracking-wider">
              Category:
            </span>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="bg-transparent font-medium text-slate-900 dark:text-white focus:outline-hidden cursor-pointer border-none py-0 pl-1 pr-4 text-xs"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="dark:bg-[#11131a] text-slate-900 dark:text-white">
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-xs text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Templates</span>
          </button>
        </div>

        {/* Seamless Fluid Title Input */}
        <div>
          <input
            type="text"
            placeholder="Chapter Title (e.g. 1. Clean Architecture & Boundaries)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 bg-transparent border-0 outline-hidden focus:outline-hidden focus:ring-0 leading-tight p-0"
          />
        </div>

        {/* Seamless Subtitle / Summary Input */}
        <div>
          <input
            type="text"
            placeholder="Add a concise takeaway or subtitle (optional)..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full text-sm sm:text-base text-slate-600 dark:text-slate-400 placeholder:text-slate-400/50 dark:placeholder:text-slate-600 bg-transparent border-0 outline-hidden focus:outline-hidden focus:ring-0 italic p-0"
          />
        </div>
      </div>

      {/* Modern Floating / Sticky Formatting Toolbar */}
      <div className="sticky top-16 z-20 bg-white/90 dark:bg-[#11131a]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1 overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0">
          {/* Headings */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => insertTextAtCursor('\n# ', '\n', 'Heading 1')}
              title="Heading 1"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('\n## ', '\n', 'Heading 2')}
              title="Heading 2"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('\n### ', '\n', 'Heading 3')}
              title="Heading 3"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Heading3 className="h-4 w-4" />
            </button>
          </div>

          {/* Typography */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => insertTextAtCursor('**', '**', 'bold text')}
              title="Bold (Ctrl+B)"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('*', '*', 'italic text')}
              title="Italic (Ctrl+I)"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('~~', '~~', 'strikethrough')}
              title="Strikethrough"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('`', '`', 'inlineCode')}
              title="Inline Code"
              className="px-1.5 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs font-mono font-semibold"
            >
              {'</>'}
            </button>
          </div>

          {/* Rich Media: Code Block, Image, Video, Bookmark */}
          <div className="flex items-center gap-1 px-1 border-r border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              title="Insert Syntax-Highlighted Code Block"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <Code className="h-3.5 w-3.5 text-indigo-500" />
              <span>Code</span>
            </button>

            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              title="Insert Image / Diagram"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
              <span>Image</span>
            </button>

            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              title="Embed Video Lecture"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Film className="h-3.5 w-3.5 text-rose-500" />
              <span>Video</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWebsiteModal(true)}
              title="Insert Website Preview Bookmark"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 text-sky-500" />
              <span>Bookmark</span>
            </button>
          </div>

          {/* Blocks: Callout, Table, Lists, Divider */}
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
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Quote className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('\n- ', '\n', 'Bullet point')}
              title="Bullet List"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('\n1. ', '\n', 'Step one')}
              title="Numbered List"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                insertTextAtCursor(
                  '\n| Concept | Description |\n| :--- | :--- |\n| Item 1 | Details... |\n\n'
                )
              }
              title="Insert Markdown Table"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <TableIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('\n---\n\n')}
              title="Horizontal Divider"
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Action: Copy Source */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            title="Copy Raw Markdown"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

      {/* Editor & Preview Workspace Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[640px]">
        {/* Editor Pane */}
        {(viewMode === 'write' || viewMode === 'split') && (
          <div
            className={`flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c0d12] shadow-xs overflow-hidden transition-all ${
              viewMode === 'write' ? 'md:col-span-2' : ''
            }`}
          >
            {/* Editor Pane Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-4 py-2.5 bg-slate-50/70 dark:bg-[#11131a] text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-3.5 w-3.5 text-indigo-500" />
                <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
                  Markdown Editor
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span>Tab indents 2 spaces</span>
                <span>•</span>
                <span>Ctrl+B Bold</span>
              </div>
            </div>

            {/* Smooth Textarea with generous padding and Obsidian monospace feel */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={handleCursorActivity}
              onClick={handleCursorActivity}
              placeholder={`# Your Title\n\nWrite your concepts, explanations, architecture notes, and code here...\n\n### Code Demonstration\n\`\`\`csharp\npublic class CleanArchitecture\n{\n    // Clean decoupling\n}\n\`\`\`\n\n### Technical Diagram\n![Architecture Diagram](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800)\n\n### Embedded Lecture\n[video:https://www.youtube.com/watch?v=d_k8k04nK_c]\n`}
              className="flex-1 w-full p-5 sm:p-6 font-mono text-[14px] leading-relaxed bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400/50 dark:placeholder:text-slate-600 focus:outline-hidden resize-none min-h-[580px] selection:bg-indigo-500/20"
            />

            {/* Status Footer Bar */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 px-4 py-2 bg-slate-50/50 dark:bg-[#0c0d12] text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>
                  Ln {cursorPos.line}, Col {cursorPos.col}
                </span>
                <span>•</span>
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{content.length} characters</span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                UTF-8 • Markdown
              </div>
            </div>
          </div>
        )}

        {/* Live Article Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090a0f] shadow-xs overflow-hidden transition-all ${
              viewMode === 'preview' ? 'md:col-span-2' : ''
            }`}
          >
            {/* Preview Pane Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-4 py-2.5 bg-slate-50/70 dark:bg-[#11131a] text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
                  Live Rendered Article
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synchronized</span>
              </div>
            </div>

            {/* Preview Content Body */}
            <div className="p-6 sm:p-8 overflow-y-auto max-h-[760px] flex-1">
              {/* Rendered Document Header */}
              {(title || summary || currentSubject) && (
                <div className="space-y-3 pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
                  {currentSubject && (
                    <Badge variant="outline" className="text-xs">
                      {currentSubject.title}
                    </Badge>
                  )}
                  {title && (
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                      {title}
                    </h1>
                  )}
                  {summary && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                      {summary}
                    </p>
                  )}
                </div>
              )}

              {content.trim() ? (
                <RichContentRenderer content={content} />
              ) : (
                <div className="py-24 text-center space-y-3 text-slate-400">
                  <FileText className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-sm italic">
                    Your formatted article, syntax highlighted code, and diagrams will render here in real-time...
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

      {/* MODAL 5: Starter Templates Picker */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Choose a Starter Template
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pre-structured layouts designed for clear technical writing and diagrams.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {STARTER_TEMPLATES.map((tmpl, idx) => (
                <div
                  key={idx}
                  onClick={() => handleApplyTemplate(tmpl.content, tmpl.title)}
                  className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {tmpl.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {tmpl.desc}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs group-hover:text-indigo-600">
                      Use
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
