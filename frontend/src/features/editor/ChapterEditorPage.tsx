import * as React from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
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
  X,
  ChevronRight,
} from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSubjects, fetchChapterById, createChapter, updateChapter } from '@/lib/api'
import { RichContentRenderer } from '@/components/content/RichContentRenderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
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
    <div className="flex flex-col h-full w-full min-h-0 bg-background overflow-hidden">
      {/* 1. TOP UNIFIED BAR: Sidebar toggle, Library, Subject Select, Chapter Title, Telemetry, View Mode, Publish */}
      <header className="flex items-center justify-between gap-3 h-12 px-3 border-b border-border bg-background/95 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <SidebarTrigger className="-ml-1 h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer" />
          <Separator orientation="vertical" className="h-4 shrink-0 hidden sm:block" />

          <Link
            to="/"
            title="Back to Subjects Library"
            className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden md:inline font-medium">Library</span>
          </Link>

          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 hidden sm:block" />

          {/* Subject Dropdown Selector */}
          <div className="shrink-0">
            <Select
              value={subjectId}
              onValueChange={(val) => {
                setSubjectId(val)
                setIsDirty(true)
              }}
            >
              <SelectTrigger className="h-7 text-xs border border-border/70 bg-muted/30 hover:bg-muted/70 font-medium focus:ring-1 focus:ring-ring px-2 gap-1.5 rounded-md max-w-[130px] sm:max-w-[180px]">
                <FolderOpen className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />

          {/* Chapter Title Input */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden md:inline" />
            <input
              type="text"
              value={title || extractedTitle}
              onChange={(e) => {
                setTitle(e.target.value)
                setIsDirty(true)
              }}
              placeholder="Untitled Chapter"
              title="Chapter Title (auto-synced with # Heading in Markdown)"
              className="bg-transparent font-semibold text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 border-b border-transparent hover:border-border focus:border-indigo-500 focus:outline-none transition-colors truncate px-1 py-0.5 w-full min-w-[80px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Live Document Telemetry */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border/70 text-[11px] text-muted-foreground whitespace-nowrap">
              <span>{wordCount} words</span>
              <span className="text-muted-foreground/40">•</span>
              <span>~{estimatedMinutes}m read</span>
            </div>

            {isDirty ? (
              <span className="flex items-center gap-1.5 text-[11px] text-amber-500 font-medium whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                Unsaved
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                Synced
              </span>
            )}
          </div>

          {/* View Mode Segmented Controller */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(val) => val && setViewMode(val as 'write' | 'split' | 'preview')}
            className="border border-border/70 rounded-md bg-muted/40 p-0.5 h-auto"
          >
            <ToggleGroupItem
              value="write"
              aria-label="Toggle Write"
              title="Write Mode"
              className="h-6 px-2 text-[11px] gap-1 data-[state=on]:bg-background data-[state=on]:shadow-2xs"
            >
              <Edit3 className="h-3 w-3" />
              <span className="hidden md:inline">Write</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="split"
              aria-label="Toggle Split"
              title="Split View"
              className="h-6 px-2 text-[11px] gap-1 data-[state=on]:bg-background data-[state=on]:shadow-2xs"
            >
              <Columns className="h-3 w-3" />
              <span className="hidden md:inline">Split</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="preview"
              aria-label="Toggle Preview"
              title="Preview Mode"
              className="h-6 px-2 text-[11px] gap-1 data-[state=on]:bg-background data-[state=on]:shadow-2xs"
            >
              <Eye className="h-3 w-3" />
              <span className="hidden md:inline">Preview</span>
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Save / Publish Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="gap-1.5 h-7 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>
              {isSaving
                ? 'Saving...'
                : editingChapterId
                ? 'Save Edits'
                : 'Publish'}
            </span>
            <kbd className="hidden sm:inline-block ml-0.5 px-1 py-0.2 bg-indigo-750/70 text-[9px] rounded font-mono text-indigo-200">
              Ctrl+S
            </kbd>
          </Button>
        </div>
      </header>

      {/* 2. DOCKED FORMATTING TOOLBAR: Headings, Markdown Tools, Typography Controls */}
      <div className="shrink-0 h-9 px-3 border-b border-border/80 bg-muted/20 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar z-10">
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Headings */}
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => handleToggleHeading(1)} title="Heading 1 (#)" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Heading1 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleToggleHeading(2)} title="Heading 2 (##)" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Heading2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleToggleHeading(3)} title="Heading 3 (###)" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Heading3 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Inline Typography */}
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => handleToggleInline('**', '**', 'bold text')} title="Bold (Ctrl+B)" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleToggleInline('*', '*', 'italic text')} title="Italic (Ctrl+I)" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Italic className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleToggleInline('~~', '~~', 'strikethrough')} title="Strikethrough (~~)" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Strikethrough className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleToggleInline('`', '`', 'inlineCode')} title="Inline Code (`)" className="h-7 w-7 text-muted-foreground hover:text-foreground text-xs font-mono font-semibold">
              {'</>'}
            </Button>
          </div>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Media Blocks */}
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setShowCodeModal(true)} title="Insert Code Block" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Code className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowImageModal(true)} title="Insert Image" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <ImageIcon className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowVideoModal(true)} title="Embed Video" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Film className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowWebsiteModal(true)} title="Insert Bookmark" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Globe className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Callouts, Lists, Tables, Divider */}
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handleToggleCallout} title="Callout Quote (> [!NOTE])" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Quote className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleToggleList('bullet')} title="Bullet List (-)" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleToggleList('ordered')} title="Numbered List (1.)" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <ListOrdered className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleInsertBlock('| Col 1 | Col 2 | Col 3 |\n| :--- | :--- | :--- |\n| Data A | Data B | Data C |')} title="Insert Table" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <TableIcon className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleInsertBlock('---')} title="Horizontal Divider (---)" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Minus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Right side: Typography & Copy */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <Select value={editorFont} onValueChange={(val) => setEditorFont(val as any)}>
            <SelectTrigger className="h-6 w-[72px] text-[11px] border-0 bg-transparent font-medium focus:ring-0 px-1 shadow-none gap-0.5 text-muted-foreground hover:text-foreground">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mono" className="text-xs">Mono</SelectItem>
              <SelectItem value="sans" className="text-xs">Sans</SelectItem>
              <SelectItem value="serif" className="text-xs">Serif</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" onClick={() => setEditorFontSize((s) => Math.max(12, s - 1))} title="Decrease font size" className="h-6 w-6 text-muted-foreground hover:text-foreground text-xs">
              −
            </Button>
            <span className="w-5 text-center text-[11px] font-semibold font-mono text-muted-foreground">
              {editorFontSize}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setEditorFontSize((s) => Math.min(26, s + 1))} title="Increase font size" className="h-6 w-6 text-muted-foreground hover:text-foreground text-xs">
              +
            </Button>
          </div>

          <Separator orientation="vertical" className="h-4 mx-0.5" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyMarkdown}
            title="Copy Raw Markdown"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            {copiedMarkdown ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* 3. RESIZABLE WORKSPACE: Full height, flex-1, zero outer margins */}
      <div className="flex-1 min-h-0 min-w-0 w-full flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 min-w-0 w-full h-full">
          {/* Editor Pane */}
          {(viewMode === 'write' || viewMode === 'split') && (
            <ResizablePanel defaultSize={viewMode === 'split' ? 50 : 100} minSize={20} className="flex flex-col h-full bg-background border-r border-border/80 overflow-hidden relative">
              {/* Editor Sub-header */}
              <div className="flex items-center justify-between border-b border-border/60 px-3 py-1 bg-muted/30 text-xs text-muted-foreground shrink-0">
                <div className="flex items-center gap-1.5">
                  <FileCode2 className="h-3 w-3 text-muted-foreground" />
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                    Markdown Editor
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-2 text-[10px] text-muted-foreground/70">
                  <span>Ctrl+B Bold</span>
                  <span>•</span>
                  <span>Tab 2 spaces</span>
                </div>
              </div>

              {/* Textarea: Notice overflow-y-auto and overflow-x-hidden */}
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
                placeholder={`# 1. Clean Architecture & Boundaries\n\nWrite your concepts, explanations, architecture notes, and code here directly in Markdown...\n\n### Core Principles\n- Decouple domain core from external infrastructure\n- Enforce unidirectional dependencies\n\n### Code Demonstration\n\`\`\`csharp\npublic class CleanArchitecture\n{\n    // Domain logic core\n}\n\`\`\`\n`}
                className={`flex-1 min-h-0 w-full p-4 sm:p-6 leading-relaxed bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none overflow-y-auto overflow-x-hidden editor-canvas selection:bg-indigo-500/20 ${
                  editorFont === 'mono'
                    ? 'font-canvas-mono'
                    : editorFont === 'sans'
                    ? 'font-canvas-sans'
                    : 'font-canvas-serif'
                }`}
                style={{ fontSize: `${editorFontSize}px` }}
              />

              {/* Status Footer */}
              <div className="flex items-center justify-between border-t border-border/60 px-3 py-1 bg-muted/20 text-[10px] text-muted-foreground shrink-0">
                <div className="flex items-center gap-2">
                  <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
                  <span>•</span>
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{content.length} chars</span>
                </div>
                <div className="hidden sm:block">
                  UTF-8 • Markdown AST
                </div>
              </div>
            </ResizablePanel>
          )}

          {viewMode === 'split' && (
            <ResizableHandle withHandle className="w-1 bg-border/60 hover:bg-primary transition-colors cursor-col-resize" />
          )}

          {/* Preview Pane */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <ResizablePanel defaultSize={viewMode === 'split' ? 50 : 100} minSize={20} className="flex flex-col h-full bg-background overflow-hidden relative">
              {/* Preview Sub-header */}
              <div className="flex items-center justify-between border-b border-border/60 px-3 py-1 bg-muted/30 text-xs text-muted-foreground shrink-0">
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                    Live Preview
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 font-mono">
                    ({editorFont} • {editorFontSize}px)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Synchronized</span>
                </div>
              </div>

              {/* Preview Content Body */}
              <div
                className={`flex-1 min-h-0 overflow-y-auto p-5 sm:p-8 ${
                  editorFont === 'mono'
                    ? 'font-canvas-mono'
                    : editorFont === 'sans'
                    ? 'font-canvas-sans'
                    : 'font-canvas-serif'
                }`}
                style={{ fontSize: `${editorFontSize}px` }}
              >
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
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 stroke-[1.5]" />
                    <p className="text-sm font-medium text-foreground">
                      Your formatted article will render here in real-time
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Type directly in Markdown: headings, bold, italic, code blocks, tables, callouts, and media embeds.
                    </p>
                  </div>
                )}
              </div>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>

      {/* MODAL 1: Insert Image Dialog */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
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
                  className="w-full h-36 p-3 rounded-lg border border-border bg-background text-foreground font-mono text-xs focus:outline-hidden"
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
