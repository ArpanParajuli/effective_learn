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

  // Custom typography preferences: Mono, Sans, or Serif font + size control (12px - 26px)
  const [editorFont, setEditorFont] = React.useState<'mono' | 'sans' | 'serif'>('mono')
  const [editorFontSize, setEditorFontSize] = React.useState<number>(16)

  // Smooth typing: Deferred content for live preview so high-frequency typing never stutters
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

  // 1. Rock-Solid Inline Formatter (Bold, Italic, Strikethrough, Inline Code)
  // Handles highlighted selection, selection already inside tags, word under cursor, or cursor in space
  const handleToggleInline = (prefix: string, suffix: string, placeholder: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = content
    const hasSelection = start !== end

    if (hasSelection) {
      const selected = text.slice(start, end)
      // Check if selected text is itself wrapped in prefix & suffix
      if (
        selected.startsWith(prefix) &&
        selected.endsWith(suffix) &&
        selected.length >= prefix.length + suffix.length
      ) {
        const unwrapped = selected.slice(prefix.length, -suffix.length)
        const newText = text.slice(0, start) + unwrapped + text.slice(end)
        setContent(newText)
        setIsDirty(true)
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start, start + unwrapped.length)
        }, 10)
        return
      }

      // Check if characters immediately surrounding the selection match prefix & suffix
      const beforePrefix = text.slice(Math.max(0, start - prefix.length), start)
      const afterSuffix = text.slice(end, end + suffix.length)
      if (beforePrefix === prefix && afterSuffix === suffix) {
        const newText = text.slice(0, start - prefix.length) + selected + text.slice(end + suffix.length)
        setContent(newText)
        setIsDirty(true)
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start - prefix.length, end - prefix.length)
        }, 10)
        return
      }

      // Wrap the highlighted selection
      const wrapped = prefix + selected + suffix
      const newText = text.slice(0, start) + wrapped + text.slice(end)
      setContent(newText)
      setIsDirty(true)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start, start + wrapped.length)
      }, 10)
      return
    }

    // No selection: detect the word under or touching the cursor
    let wordStart = start
    let wordEnd = start

    while (wordStart > 0 && !/\s/.test(text[wordStart - 1])) {
      wordStart--
    }
    while (wordEnd < text.length && !/\s/.test(text[wordEnd])) {
      wordEnd++
    }

    // If cursor is on a word
    if (wordStart < wordEnd) {
      const word = text.slice(wordStart, wordEnd)

      // Check if word is already surrounded by prefix & suffix
      const beforeWord = text.slice(Math.max(0, wordStart - prefix.length), wordStart)
      const afterWord = text.slice(wordEnd, wordEnd + suffix.length)
      if (beforeWord === prefix && afterWord === suffix) {
        // Unwrap word
        const newText = text.slice(0, wordStart - prefix.length) + word + text.slice(wordEnd + suffix.length)
        setContent(newText)
        setIsDirty(true)
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(wordStart - prefix.length, wordEnd - prefix.length)
        }, 10)
        return
      }

      if (word.startsWith(prefix) && word.endsWith(suffix) && word.length >= prefix.length + suffix.length) {
        const unwrapped = word.slice(prefix.length, -suffix.length)
        const newText = text.slice(0, wordStart) + unwrapped + text.slice(wordEnd)
        setContent(newText)
        setIsDirty(true)
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(wordStart, wordStart + unwrapped.length)
        }, 10)
        return
      }

      // Wrap the word
      const wrapped = prefix + word + suffix
      const newText = text.slice(0, wordStart) + wrapped + text.slice(wordEnd)
      setContent(newText)
      setIsDirty(true)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(wordStart, wordStart + wrapped.length)
      }, 10)
      return
    }

    // Cursor is on whitespace or empty line: insert template with placeholder selected
    const inserted = prefix + placeholder + suffix
    const newText = text.slice(0, start) + inserted + text.slice(end)
    setContent(newText)
    setIsDirty(true)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length)
    }, 10)
  }

  // 2. Rock-Solid Line Heading Formatter (H1, H2, H3)
  // Transforms the current line into a heading or toggles it back to normal text
  const handleToggleHeading = (level: 1 | 2 | 3) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const text = content
    const targetPrefix = '#'.repeat(level) + ' '

    const lineStart = text.lastIndexOf('\n', start - 1) + 1
    let lineEnd = text.indexOf('\n', start)
    if (lineEnd === -1) lineEnd = text.length

    const currentLine = text.substring(lineStart, lineEnd)

    let newLine = currentLine
    if (currentLine.startsWith(targetPrefix)) {
      // Toggle off: strip the target heading
      newLine = currentLine.slice(targetPrefix.length)
    } else if (/^#{1,6}\s+/.test(currentLine)) {
      // Replace existing heading with the target heading
      newLine = currentLine.replace(/^#{1,6}\s+/, targetPrefix)
    } else {
      // Prepend heading to the line
      newLine = targetPrefix + currentLine
    }

    const newText = text.slice(0, lineStart) + newLine + text.slice(lineEnd)
    setContent(newText)
    setIsDirty(true)

    const offsetDiff = newLine.length - currentLine.length
    const newCursor = Math.max(lineStart, Math.min(newText.length, start + offsetDiff))
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursor, newCursor)
    }, 10)
  }

  // 3. Rock-Solid List Formatter (Bullet `-`, Numbered `1.`)
  // Applies bullet or ordered numbering across current line or all selected lines
  const handleToggleList = (type: 'bullet' | 'ordered') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = content

    const lineStart = text.lastIndexOf('\n', start - 1) + 1
    let lineEnd = text.indexOf('\n', end)
    if (lineEnd === -1) lineEnd = text.length

    const lines = text.substring(lineStart, lineEnd).split('\n')
    const allHaveBullet = lines.every((l) => /^(\s*)[-*]\s+/.test(l))
    const allHaveOrdered = lines.every((l) => /^(\s*)\d+\.\s+/.test(l))

    let newLines: string[] = []

    if (type === 'bullet') {
      if (allHaveBullet) {
        // Toggle off
        newLines = lines.map((l) => l.replace(/^(\s*)[-*]\s+/, '$1'))
      } else {
        // Apply bullet
        newLines = lines.map((l) => {
          const stripped = l.replace(/^(\s*)(\d+\.\s+|[-*]\s+)/, '$1')
          return stripped.trim() ? `- ${stripped.trimStart()}` : '- '
        })
      }
    } else {
      if (allHaveOrdered) {
        // Toggle off
        newLines = lines.map((l) => l.replace(/^(\s*)\d+\.\s+/, '$1'))
      } else {
        // Apply ordered numbers
        newLines = lines.map((l, idx) => {
          const stripped = l.replace(/^(\s*)(\d+\.\s+|[-*]\s+)/, '$1')
          return stripped.trim() ? `${idx + 1}. ${stripped.trimStart()}` : `${idx + 1}. `
        })
      }
    }

    const replacement = newLines.join('\n')
    const newText = text.slice(0, lineStart) + replacement + text.slice(lineEnd)
    setContent(newText)
    setIsDirty(true)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(lineStart, lineStart + replacement.length)
    }, 10)
  }

  // 4. Rock-Solid Callout Box Formatter (`> [!NOTE]`)
  const handleToggleCallout = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = content

    const lineStart = text.lastIndexOf('\n', start - 1) + 1
    let lineEnd = text.indexOf('\n', end)
    if (lineEnd === -1) lineEnd = text.length

    const target = text.substring(lineStart, lineEnd)

    if (target.startsWith('> [!NOTE]')) {
      const unwrapped = target
        .replace(/^>\s*\[!NOTE\]\n?/m, '')
        .replace(/^>\s?/gm, '')
      const newText = text.slice(0, lineStart) + unwrapped + text.slice(lineEnd)
      setContent(newText)
      setIsDirty(true)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(lineStart, lineStart + unwrapped.length)
      }, 10)
      return
    }

    const lines = target.split('\n')
    const calloutBody = lines.map((l) => `> ${l.replace(/^>\s?/, '')}`).join('\n')
    const callout = `> [!NOTE]\n${calloutBody || '> Key architectural takeaway or core concept.'}`

    const newText = text.slice(0, lineStart) + callout + text.slice(lineEnd)
    setContent(newText)
    setIsDirty(true)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(lineStart, lineStart + callout.length)
    }, 10)
  }

  // 5. Clean Block Insertion (Table, Divider, Media)
  const handleInsertBlock = (blockText: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setContent((prev) => prev + '\n\n' + blockText + '\n\n')
      setIsDirty(true)
      return
    }

    const start = textarea.selectionStart
    const text = content
    const before = text.slice(0, start)
    const after = text.slice(start)

    const needLeading = before.length > 0 && !before.endsWith('\n\n')
    const leading = needLeading ? (before.endsWith('\n') ? '\n' : '\n\n') : ''
    const needTrailing = after.length > 0 && !after.startsWith('\n\n')
    const trailing = needTrailing ? (after.startsWith('\n') ? '\n' : '\n\n') : ''

    const snippet = leading + blockText + trailing
    const newText = before + snippet + after
    setContent(newText)
    setIsDirty(true)

    const newCursor = start + leading.length + blockText.length
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursor, newCursor)
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
      handleToggleInline('**', '**', 'bold text')
    }

    // Ctrl+I italic shortcut
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      handleToggleInline('*', '*', 'italic text')
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

  // Insert Media Handlers
  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl.trim()) return
    const altText = imageAlt.trim() || 'Architecture diagram'
    handleInsertBlock(`![${altText}](${imageUrl.trim()})`)
    setImageUrl('')
    setImageAlt('')
    setShowImageModal(false)
    toast.success('Image integrated!')
  }

  const handleInsertCode = (e: React.FormEvent) => {
    e.preventDefault()
    const snippet = codeSnippet.trim() || '// Write your code here'
    handleInsertBlock(`\`\`\`${codeLanguage}\n${snippet}\n\`\`\``)
    setCodeSnippet('')
    setShowCodeModal(false)
    toast.success(`${codeLanguage.toUpperCase()} code block inserted!`)
  }

  const handleInsertVideo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoUrl.trim()) return
    handleInsertBlock(`[video:${videoUrl.trim()}]`)
    setVideoUrl('')
    setShowVideoModal(false)
    toast.success('Video lecture embedded!')
  }

  const handleInsertWebsite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!websiteUrl.trim()) return
    const tag = websiteTitle.trim()
      ? `[website:${websiteUrl.trim()}|${websiteTitle.trim()}]`
      : `[website:${websiteUrl.trim()}]`
    handleInsertBlock(tag)
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
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 pb-2 border-b border-border">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link
            to={subjectId ? `/subjects/${subjectId}` : '/'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors"
            title="Back to Subject"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Clean Subject Category Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-muted/60 dark:bg-zinc-950 text-xs">
            <FolderOpen className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:inline">
              Subject:
            </span>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value)
                setIsDirty(true)
              }}
              className="bg-transparent font-semibold text-foreground border-0 py-0 pl-1 pr-2 text-xs focus:outline-hidden cursor-pointer"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="dark:bg-zinc-950 text-foreground">
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Document Title Breadcrumb & Quick Rename */}
          <div className="flex items-center gap-1.5 max-w-[200px] sm:max-w-[320px]">
            <span className="text-zinc-400 dark:text-zinc-600 hidden sm:inline select-none">/</span>
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:inline" />
            <input
              type="text"
              value={title || extractedTitle}
              onChange={(e) => {
                setTitle(e.target.value)
                setIsDirty(true)
              }}
              placeholder="Untitled Chapter"
              title="Chapter Title (auto-synced with # Heading in Markdown)"
              className="bg-transparent font-semibold text-xs sm:text-sm text-foreground placeholder:text-muted-foreground border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-hidden transition-colors truncate px-1 py-0.5"
            />
          </div>

          {/* Live Document Telemetry */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted dark:bg-zinc-950 border border-border text-[11px] text-muted-foreground">
              <span>{wordCount} words</span>
              <span className="text-zinc-500">•</span>
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
          <div className="flex items-center rounded-lg border border-border bg-muted dark:bg-zinc-950 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('write')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                viewMode === 'write'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
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
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
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
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
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
      <div className="shrink-0 bg-card border border-border shadow-2xs rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0">
          {/* Headings */}
          <div className="flex items-center gap-0.5 pr-1.5 border-r border-border">
            <button
              type="button"
              onClick={() => handleToggleHeading(1)}
              title="Heading 1 (# )"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleHeading(2)}
              title="Heading 2 (## )"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleHeading(3)}
              title="Heading 3 (### )"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Heading3 className="h-4 w-4" />
            </button>
          </div>

          {/* Inline Typography */}
          <div className="flex items-center gap-0.5 px-1.5 border-r border-border">
            <button
              type="button"
              onClick={() => handleToggleInline('**', '**', 'bold text')}
              title="Bold (Ctrl+B)"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleInline('*', '*', 'italic text')}
              title="Italic (Ctrl+I)"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleInline('~~', '~~', 'strikethrough')}
              title="Strikethrough (~~)"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleInline('`', '`', 'inlineCode')}
              title="Inline Code (`)"
              className="h-8 px-2 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer text-xs font-mono font-semibold"
            >
              {'</>'}
            </button>
          </div>

          {/* Media Blocks */}
          <div className="flex items-center gap-1 px-1.5 border-r border-border">
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              title="Insert Syntax-Highlighted Code Block"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Code className="h-4 w-4 text-indigo-500" />
              <span>Code</span>
            </button>

            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              title="Insert Image / Diagram"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ImageIcon className="h-4 w-4 text-emerald-500" />
              <span>Image</span>
            </button>

            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              title="Embed Video Lecture"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Film className="h-4 w-4 text-rose-500" />
              <span>Video</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWebsiteModal(true)}
              title="Insert Website Preview Bookmark"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Globe className="h-4 w-4 text-sky-500" />
              <span>Bookmark</span>
            </button>
          </div>

          {/* Callouts, Lists, Tables, Divider */}
          <div className="flex items-center gap-0.5 pl-1">
            <button
              type="button"
              onClick={handleToggleCallout}
              title="Obsidian Callout Box (> [!NOTE])"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Quote className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleList('bullet')}
              title="Bullet List (- )"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleList('ordered')}
              title="Numbered List (1. )"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                handleInsertBlock(
                  '| Concept | Architectural Role | Status |\n| :--- | :--- | :--- |\n| Clean Architecture | Decouples domain core from infra | Verified |\n| PostgreSQL 17 | Relational persistence with BRIN | Active |\n| Prism Engine | Multi-language syntax highlighting | Complete |'
                )
              }
              title="Insert Markdown Table"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <TableIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleInsertBlock('---')}
              title="Horizontal Divider (---)"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Action: Enhanced Typography Controls & Copy Source */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Enhanced Font Family & Size Controller */}
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-card shadow-2xs">
            <Type className="h-4 w-4 text-indigo-500 shrink-0" />
            <select
              value={editorFont}
              onChange={(e) => setEditorFont(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-foreground border-0 py-0 pl-0 pr-1 focus:outline-hidden cursor-pointer"
            >
              <option value="mono" className="dark:bg-zinc-950">Mono (Fira/JetBrains)</option>
              <option value="sans" className="dark:bg-zinc-950">Sans (Inter Clean)</option>
              <option value="serif" className="dark:bg-zinc-950">Serif (Lora Book)</option>
            </select>
            <div className="flex items-center gap-1 pl-2 border-l border-border">
              <button
                type="button"
                onClick={() => setEditorFontSize((s) => Math.max(12, s - 1))}
                title="Decrease font size"
                className="h-6 w-6 flex items-center justify-center rounded-md text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                −
              </button>
              <span className="min-w-6 text-center text-xs font-semibold font-mono text-foreground">
                {editorFontSize}px
              </span>
              <button
                type="button"
                onClick={() => setEditorFontSize((s) => Math.min(26, s + 1))}
                title="Increase font size"
                className="h-6 w-6 flex items-center justify-center rounded-md text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            title="Copy Raw Markdown"
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {copiedMarkdown ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-500 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Copy Source</span>
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
            className={`flex flex-col h-full rounded-xl border border-border bg-black shadow-2xs overflow-hidden ${
              viewMode === 'write' ? 'md:col-span-2' : ''
            }`}
          >
            {/* Editor Pane Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-muted/60 dark:bg-zinc-950 text-xs text-muted-foreground shrink-0">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-3.5 w-3.5 text-indigo-500" />
                <span className="font-semibold uppercase tracking-wider text-[11px] text-foreground">
                  Markdown Canvas
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ({editorFont} • {editorFontSize}px)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span>Tab: 2 spaces</span>
                <span>•</span>
                <span>Ctrl+B: Bold</span>
                <span>•</span>
                <span>Ctrl+S: Save</span>
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
              className={`flex-1 min-h-0 w-full p-4 sm:p-5 leading-relaxed bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-hidden resize-none overflow-y-auto editor-canvas selection:bg-indigo-500/20 ${
                editorFont === 'mono'
                  ? 'font-canvas-mono'
                  : editorFont === 'sans'
                  ? 'font-canvas-sans'
                  : 'font-canvas-serif'
              }`}
              style={{ fontSize: `${editorFontSize}px` }}
            />

            {/* Status Footer Bar */}
            <div className="flex items-center justify-between border-t border-border px-4 py-1.5 bg-muted/40 dark:bg-zinc-950 text-[11px] text-muted-foreground shrink-0">
              <div className="flex items-center gap-3">
                <span>
                  Ln {cursorPos.line}, Col {cursorPos.col}
                </span>
                <span>•</span>
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{content.length} chars</span>
              </div>
              <div className="text-[11px] text-muted-foreground hidden sm:block">
                UTF-8 • Markdown AST
              </div>
            </div>
          </div>
        )}

        {/* Live Article Preview Pane with Inherited Typography */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`flex flex-col h-full rounded-xl border border-border bg-black shadow-2xs overflow-hidden ${
              viewMode === 'preview' ? 'md:col-span-2' : ''
            }`}
          >
            {/* Preview Pane Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-muted/60 dark:bg-zinc-950 text-xs text-muted-foreground shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-semibold uppercase tracking-wider text-[11px] text-foreground">
                  Live Article Preview
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ({editorFont} • {editorFontSize}px)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Synchronized</span>
              </div>
            </div>

            {/* Preview Content Body: Inherits user font and font size */}
            <div
              className={`flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 ${
                editorFont === 'mono'
                  ? 'font-canvas-mono'
                  : editorFont === 'sans'
                  ? 'font-canvas-sans'
                  : 'font-canvas-serif'
              }`}
              style={{ fontSize: `${editorFontSize}px` }}
            >
              {/* Optional Subject Pill */}
              {currentSubject && (
                <div className="mb-4">
                  <Badge variant="outline" className="text-xs font-semibold border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20">
                    {currentSubject.title}
                  </Badge>
                </div>
              )}

              {deferredContent.trim() ? (
                <RichContentRenderer
                  content={deferredContent}
                  fontFamily={editorFont}
                  fontSize={editorFontSize}
                />
              ) : (
                <div className="py-24 text-center space-y-3 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto text-zinc-400 dark:text-zinc-600 stroke-[1.5]" />
                  <p className="text-sm font-medium text-foreground">
                    Your formatted article will render here in real-time
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-emerald-500" />
                Integrate Image / Diagram
              </h3>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Embed architecture diagrams, flowcharts, or system schematics via direct URL.
            </p>
            <form onSubmit={handleInsertImage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
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
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Caption / Alt Description
                </label>
                <Input
                  placeholder="e.g. Distributed Database Topology Diagram"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
              </div>

              {imageUrl && (
                <div className="rounded-lg border border-border p-2 bg-muted/40 max-h-40 overflow-hidden">
                  <p className="text-[10px] text-muted-foreground mb-1">Live Image Preview:</p>
                  <img src={imageUrl} alt="preview" className="max-h-32 object-contain mx-auto rounded" />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Code className="h-5 w-5 text-indigo-500" />
                Insert Code Block
              </h3>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleInsertCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Language Syntax Highlighting
                </label>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-background dark:bg-black px-3 py-2 text-sm text-foreground"
                >
                  {PROGRAMMING_LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value} className="dark:bg-zinc-950">
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Code Snippet (Optional)
                </label>
                <textarea
                  placeholder="// Paste or write initial code here..."
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  className="w-full h-36 p-3 rounded-lg border border-border bg-black text-foreground font-mono text-xs focus:outline-hidden"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Film className="h-5 w-5 text-rose-500" />
                Embed Video Lecture
              </h3>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleInsertVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Globe className="h-5 w-5 text-sky-500" />
                Insert Website Bookmark
              </h3>
              <button
                type="button"
                onClick={() => setShowWebsiteModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleInsertWebsite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
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
                <label className="block text-xs font-semibold text-foreground mb-1">
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
