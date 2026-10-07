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
  UploadCloud,
  Upload,
  Play,
  FileVideo,
  Loader2,
  Trash2,
} from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSubjects, fetchChapterById, createChapter, updateChapter, uploadMediaFile } from '@/lib/api'
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
  const [imageSourceTab, setImageSourceTab] = React.useState<'local' | 'url'>('local')
  const [imageUrl, setImageUrl] = React.useState('')
  const [imageAlt, setImageAlt] = React.useState('')
  const [localImageFile, setLocalImageFile] = React.useState<File | null>(null)
  const [localImagePreview, setLocalImagePreview] = React.useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = React.useState(false)
  const [imageUploadProgress, setImageUploadProgress] = React.useState(0)
  const imageFileInputRef = React.useRef<HTMLInputElement>(null)

  const [showCodeModal, setShowCodeModal] = React.useState(false)
  const [codeLanguage, setCodeLanguage] = React.useState('csharp')
  const [codeSnippet, setCodeSnippet] = React.useState('')

  const [showVideoModal, setShowVideoModal] = React.useState(false)
  const [videoSourceTab, setVideoSourceTab] = React.useState<'local' | 'url'>('local')
  const [videoUrl, setVideoUrl] = React.useState('')
  const [videoTitle, setVideoTitle] = React.useState('')
  const [localVideoFile, setLocalVideoFile] = React.useState<File | null>(null)
  const [localVideoPreview, setLocalVideoPreview] = React.useState<string | null>(null)
  const [isUploadingVideo, setIsUploadingVideo] = React.useState(false)
  const [videoUploadProgress, setVideoUploadProgress] = React.useState(0)
  const videoFileInputRef = React.useRef<HTMLInputElement>(null)

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

  // File Selection Handlers
  const handleSelectImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (.png, .jpg, .webp, .svg, .gif).')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Image size exceeds 25 MB limit.')
      return
    }
    setLocalImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    setLocalImagePreview(previewUrl)
    if (!imageAlt) {
      setImageAlt(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '))
    }
  }

  const handleSelectVideoFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file (.mp4, .webm, .mov, etc.).')
      return
    }
    if (file.size > 150 * 1024 * 1024) {
      toast.error('Video size exceeds 150 MB limit.')
      return
    }
    setLocalVideoFile(file)
    const previewUrl = URL.createObjectURL(file)
    setLocalVideoPreview(previewUrl)
    if (!videoTitle) {
      setVideoTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '))
    }
  }

  // Insert Media Handlers
  const handleInsertImage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (imageSourceTab === 'local') {
      if (!localImageFile) {
        toast.error('Please choose an image file from your computer.')
        return
      }

      setIsUploadingImage(true)
      setImageUploadProgress(0)
      try {
        const result = await uploadMediaFile(localImageFile, (pct) => setImageUploadProgress(pct))
        const altText = imageAlt.trim() || localImageFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
        handleInsertBlock(`![${altText}](${result.url})`)
        toast.success('Image successfully uploaded and inserted!')
        setShowImageModal(false)
        setLocalImageFile(null)
        setLocalImagePreview(null)
        setImageAlt('')
      } catch (err: any) {
        toast.error(err.response?.data?.detail || 'Failed to upload image. Please try again.')
      } finally {
        setIsUploadingImage(false)
        setImageUploadProgress(0)
      }
    } else {
      if (!imageUrl.trim()) {
        toast.error('Please enter an image URL.')
        return
      }
      const altText = imageAlt.trim() || 'Technical Architecture Diagram'
      handleInsertBlock(`![${altText}](${imageUrl.trim()})`)
      setImageUrl('')
      setImageAlt('')
      setShowImageModal(false)
      toast.success('Image integrated!')
    }
  }

  const handleInsertCode = (e: React.FormEvent) => {
    e.preventDefault()
    const snippet = codeSnippet.trim() || '// Write your code here'
    handleInsertBlock(`\`\`\`${codeLanguage}\n${snippet}\n\`\`\``)
    setCodeSnippet('')
    setShowCodeModal(false)
    toast.success(`${codeLanguage.toUpperCase()} code block inserted!`)
  }

  const handleInsertVideo = async (e: React.FormEvent) => {
    e.preventDefault()

    if (videoSourceTab === 'local') {
      if (!localVideoFile) {
        toast.error('Please choose a video file from your computer.')
        return
      }

      setIsUploadingVideo(true)
      setVideoUploadProgress(0)
      try {
        const result = await uploadMediaFile(localVideoFile, (pct) => setVideoUploadProgress(pct))
        handleInsertBlock(`[video:${result.url}]`)
        toast.success('Video uploaded and embedded successfully!')
        setShowVideoModal(false)
        setLocalVideoFile(null)
        setLocalVideoPreview(null)
        setVideoTitle('')
      } catch (err: any) {
        toast.error(err.response?.data?.detail || 'Failed to upload video. Please try again.')
      } finally {
        setIsUploadingVideo(false)
        setVideoUploadProgress(0)
      }
    } else {
      if (!videoUrl.trim()) {
        toast.error('Please enter a YouTube or direct Video URL.')
        return
      }
      handleInsertBlock(`[video:${videoUrl.trim()}]`)
      setVideoUrl('')
      setVideoTitle('')
      setShowVideoModal(false)
      toast.success('Video lecture embedded!')
    }
  }

  // Direct Clipboard Paste Listener (Ctrl+V with image file)
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          toast.info('Uploading pasted image from clipboard...')
          try {
            const res = await uploadMediaFile(file)
            handleInsertBlock(`![Pasted image](${res.url})`)
            toast.success('Pasted image uploaded & inserted!')
          } catch {
            toast.error('Failed to upload pasted image.')
          }
          return
        }
      }
    }
  }

  // Direct File Drop Listener (Drag and drop files directly onto editor)
  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        e.preventDefault()
        toast.info(`Uploading image: ${file.name}...`)
        try {
          const res = await uploadMediaFile(file)
          handleInsertBlock(`![${file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}](${res.url})`)
          toast.success('Image uploaded & inserted!')
        } catch {
          toast.error('Failed to upload image.')
        }
      } else if (file.type.startsWith('video/')) {
        e.preventDefault()
        toast.info(`Uploading video: ${file.name}...`)
        try {
          const res = await uploadMediaFile(file)
          handleInsertBlock(`[video:${res.url}]`)
          toast.success('Video uploaded & embedded!')
        } catch {
          toast.error('Failed to upload video.')
        }
      }
    }
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
                onPaste={handlePaste}
                onDrop={handleDrop}
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
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-indigo-500" />
                Insert Image or Diagram
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false)
                  setLocalImageFile(null)
                  setLocalImagePreview(null)
                  setImageUrl('')
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Source Mode Tabs */}
            <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-lg border border-border text-xs font-medium">
              <button
                type="button"
                onClick={() => setImageSourceTab('local')}
                className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  imageSourceTab === 'local'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5 text-indigo-500" />
                Upload from PC
              </button>
              <button
                type="button"
                onClick={() => setImageSourceTab('url')}
                className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  imageSourceTab === 'url'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Globe className="h-3.5 w-3.5 text-sky-500" />
                From Web URL
              </button>
            </div>

            <form onSubmit={handleInsertImage} className="space-y-4">
              {imageSourceTab === 'local' ? (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={imageFileInputRef}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSelectImageFile(e.target.files[0])
                      }
                    }}
                  />

                  {localImagePreview ? (
                    <div className="rounded-xl border border-border p-3 bg-muted/20 space-y-2">
                      <div className="relative group max-h-48 overflow-hidden rounded-lg bg-black/5 flex items-center justify-center">
                        <img
                          src={localImagePreview}
                          alt="Local preview"
                          className="max-h-44 object-contain rounded-md mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLocalImageFile(null)
                            setLocalImagePreview(null)
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-md bg-black/70 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span className="truncate max-w-[240px] font-medium text-foreground">
                          {localImageFile?.name}
                        </span>
                        <span className="font-mono text-[11px]">
                          {localImageFile && (localImageFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => imageFileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleSelectImageFile(e.dataTransfer.files[0])
                        }
                      }}
                      className="border-2 border-dashed border-border/80 hover:border-indigo-500/80 bg-muted/20 hover:bg-muted/40 transition-all rounded-xl p-6 text-center cursor-pointer space-y-2 group"
                    >
                      <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Click to browse or drag & drop an image
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          PNG, JPG, WebP, SVG, GIF up to 25 MB
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Upload Progress Bar */}
                  {isUploadingImage && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                          <Loader2 className="h-3 w-3 animate-spin" /> Uploading image to server...
                        </span>
                        <span className="font-mono">{imageUploadProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all duration-150 rounded-full"
                          style={{ width: `${imageUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Caption / Alt Description (Optional)
                    </label>
                    <Input
                      placeholder="e.g. Distributed Database Topology Diagram"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Image Direct Web URL
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
                      placeholder="e.g. Database Index Architecture"
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
                    <ImageIcon className="h-3 w-3 mr-1" /> Use Sample Diagram
                  </Button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowImageModal(false)
                    setLocalImageFile(null)
                    setLocalImagePreview(null)
                    setImageUrl('')
                  }}
                  disabled={isUploadingImage}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isUploadingImage ||
                    (imageSourceTab === 'local' && !localImageFile) ||
                    (imageSourceTab === 'url' && !imageUrl.trim())
                  }
                  className="gap-1.5"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : imageSourceTab === 'local' ? (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Upload & Insert
                    </>
                  ) : (
                    'Insert Image'
                  )}
                </Button>
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
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Film className="h-5 w-5 text-rose-500" />
                Embed Video Lecture
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowVideoModal(false)
                  setLocalVideoFile(null)
                  setLocalVideoPreview(null)
                  setVideoUrl('')
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Source Mode Tabs */}
            <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-lg border border-border text-xs font-medium">
              <button
                type="button"
                onClick={() => setVideoSourceTab('local')}
                className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  videoSourceTab === 'local'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5 text-rose-500" />
                Upload from PC
              </button>
              <button
                type="button"
                onClick={() => setVideoSourceTab('url')}
                className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  videoSourceTab === 'url'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Film className="h-3.5 w-3.5 text-indigo-500" />
                YouTube / URL
              </button>
            </div>

            <form onSubmit={handleInsertVideo} className="space-y-4">
              {videoSourceTab === 'local' ? (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={videoFileInputRef}
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSelectVideoFile(e.target.files[0])
                      }
                    }}
                  />

                  {localVideoPreview ? (
                    <div className="rounded-xl border border-border p-3 bg-muted/20 space-y-2">
                      <div className="relative overflow-hidden rounded-lg bg-black">
                        <video
                          src={localVideoPreview}
                          controls
                          className="w-full max-h-52 object-contain rounded-md mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLocalVideoFile(null)
                            setLocalVideoPreview(null)
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-md bg-black/70 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                          title="Remove video file"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span className="truncate max-w-[240px] font-medium text-foreground">
                          {localVideoFile?.name}
                        </span>
                        <span className="font-mono text-[11px]">
                          {localVideoFile && (localVideoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => videoFileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleSelectVideoFile(e.dataTransfer.files[0])
                        }
                      }}
                      className="border-2 border-dashed border-border/80 hover:border-rose-500/80 bg-muted/20 hover:bg-muted/40 transition-all rounded-xl p-6 text-center cursor-pointer space-y-2 group"
                    >
                      <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <FileVideo className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Click to browse or drag & drop a video file
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          MP4, WebM, MOV, MKV up to 150 MB
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Upload Progress Bar */}
                  {isUploadingVideo && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                          <Loader2 className="h-3 w-3 animate-spin" /> Uploading video to storage...
                        </span>
                        <span className="font-mono">{videoUploadProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-600 transition-all duration-150 rounded-full"
                          style={{ width: `${videoUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Lecture Title / Caption (Optional)
                    </label>
                    <Input
                      placeholder="e.g. Distributed Consensus Algorithms Lecture"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      YouTube or Direct Video URL
                    </label>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=... or https://.../video.mp4"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => {
                      setVideoUrl('https://www.youtube.com/watch?v=yF9SwL0p0Y0')
                    }}
                  >
                    <Play className="h-3 w-3 mr-1 text-rose-500" /> Use Sample YouTube Lecture
                  </Button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowVideoModal(false)
                    setLocalVideoFile(null)
                    setLocalVideoPreview(null)
                    setVideoUrl('')
                  }}
                  disabled={isUploadingVideo}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isUploadingVideo ||
                    (videoSourceTab === 'local' && !localVideoFile) ||
                    (videoSourceTab === 'url' && !videoUrl.trim())
                  }
                  className="gap-1.5"
                >
                  {isUploadingVideo ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Uploading ({videoUploadProgress}%)...
                    </>
                  ) : videoSourceTab === 'local' ? (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Upload & Embed Video
                    </>
                  ) : (
                    'Embed Video'
                  )}
                </Button>
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
