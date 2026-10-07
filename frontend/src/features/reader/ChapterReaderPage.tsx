import * as React from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  Calendar,
  Edit3,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Type,
  List,
  Minimize2,
  Presentation,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchChapterById, fetchChaptersBySubject } from '@/lib/api'
import { RichContentRenderer } from '@/components/content/RichContentRenderer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { toast } from 'sonner'

export function ChapterReaderPage() {
  const { chapterId } = useParams<{ chapterId: string }>()
  const navigate = useNavigate()

  // Chapter and Subject data queries
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

  // Reading Experience Preferences (Persisted in localStorage)
  const [isFocusMode, setIsFocusMode] = React.useState(false)
  const [readerFont, setReaderFont] = React.useState<'serif' | 'sans' | 'mono'>(() => {
    return (localStorage.getItem('effectivelearn_reader_font') as any) || 'serif'
  })
  const [readerFontSize, setReaderFontSize] = React.useState<number>(() => {
    const saved = localStorage.getItem('effectivelearn_reader_fontsize')
    return saved ? parseInt(saved, 10) : 17
  })
  const [readerTint, setReaderTint] = React.useState<'default' | 'sepia' | 'midnight'>(() => {
    return (localStorage.getItem('effectivelearn_reader_tint') as any) || 'default'
  })
  const [readerWidth, setReaderWidth] = React.useState<'optimal' | 'wide'>(() => {
    return (localStorage.getItem('effectivelearn_reader_width') as any) || 'optimal'
  })
  const [focusSpotlight, setFocusSpotlight] = React.useState<boolean>(() => {
    return localStorage.getItem('effectivelearn_reader_spotlight') === 'true'
  })

  // Synchronize preferences to localStorage
  React.useEffect(() => {
    localStorage.setItem('effectivelearn_reader_font', readerFont)
  }, [readerFont])
  React.useEffect(() => {
    localStorage.setItem('effectivelearn_reader_fontsize', readerFontSize.toString())
  }, [readerFontSize])
  React.useEffect(() => {
    localStorage.setItem('effectivelearn_reader_tint', readerTint)
  }, [readerTint])
  React.useEffect(() => {
    localStorage.setItem('effectivelearn_reader_width', readerWidth)
  }, [readerWidth])
  React.useEffect(() => {
    localStorage.setItem('effectivelearn_reader_spotlight', focusSpotlight ? 'true' : 'false')
  }, [focusSpotlight])

  // Scroll Progress Calculation
  const [scrollProgress, setScrollProgress] = React.useState(0)
  const articleContainerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = isFocusMode && articleContainerRef.current
        ? articleContainerRef.current.scrollTop
        : (window.scrollY || document.documentElement.scrollTop)

      const scrollHeight = isFocusMode && articleContainerRef.current
        ? articleContainerRef.current.scrollHeight - articleContainerRef.current.clientHeight
        : (document.documentElement.scrollHeight - window.innerHeight)

      if (scrollHeight > 0) {
        const pct = Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)))
        setScrollProgress(pct)
      } else {
        setScrollProgress(0)
      }
    }

    if (isFocusMode && articleContainerRef.current) {
      const container = articleContainerRef.current
      container.addEventListener('scroll', handleScroll, { passive: true })
      return () => container.removeEventListener('scroll', handleScroll)
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [isFocusMode, chapter?.content])

  // Dynamic Minutes Left
  const remainingMinutes = React.useMemo(() => {
    const totalMin = chapter?.estimatedMinutes || 1
    if (scrollProgress >= 95) return 0
    return Math.max(1, Math.ceil(totalMin * (1 - scrollProgress / 100)))
  }, [chapter?.estimatedMinutes, scrollProgress])

  // Extract Heading Outline from Markdown AST
  const headings = React.useMemo(() => {
    if (!chapter?.content) return []
    const lines = chapter.content.split('\n')
    const list: { level: number; text: string }[] = []
    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/)
      if (match) {
        list.push({
          level: match[1].length,
          text: match[2].trim(),
        })
      }
    })
    return list
  }, [chapter?.content])

  // Smooth scroll to heading in article
  const scrollToHeading = (text: string) => {
    const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
    const target = allHeadings.find(
      (h) => h.textContent?.trim().toLowerCase() === text.trim().toLowerCase()
    )
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Keyboard Shortcuts (F to toggle Focus, Esc to exit Focus, [ and ] for chapters)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'f' || e.key === 'F') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          setIsFocusMode((prev) => !prev)
          if (!isFocusMode) {
            toast.info('Focus Mode enabled. Press Esc or F to exit.')
          }
        }
      }

      if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey && !e.metaKey && chapter?.id) {
        e.preventDefault()
        navigate(`/present/${chapter.id}`)
      }

      if (e.key === 'Escape' && isFocusMode) {
        e.preventDefault()
        setIsFocusMode(false)
      }

      if (e.key === '[' && prevChapter) {
        e.preventDefault()
        navigate(`/read/${prevChapter.id}`)
      }

      if (e.key === ']' && nextChapter) {
        e.preventDefault()
        navigate(`/read/${nextChapter.id}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFocusMode, prevChapter, nextChapter, navigate])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Chapter link copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
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
        <p className="text-base font-semibold text-foreground">Chapter not found</p>
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Return to Subjects
          </Button>
        </Link>
      </div>
    )
  }

  const tintClass =
    readerTint === 'sepia'
      ? 'reader-tint-sepia'
      : readerTint === 'midnight'
      ? 'reader-tint-midnight'
      : ''

  const widthClass = readerWidth === 'optimal' ? 'max-w-2xl' : 'max-w-3xl'

  // Component: Appearance Customizer Dropdown
  const AppearanceMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
          title="Reading Appearance & Atmosphere"
        >
          <Type className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Appearance</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-3 space-y-3">
        <div className="space-y-1">
          <DropdownMenuLabel className="p-0 text-xs font-semibold text-foreground">
            Typography
          </DropdownMenuLabel>
          <div className="grid grid-cols-3 gap-1 pt-1">
            <button
              onClick={() => setReaderFont('serif')}
              className={`px-2 py-1.5 text-xs rounded-md border text-center transition-colors font-serif cursor-pointer ${
                readerFont === 'serif'
                  ? 'border-primary bg-primary text-primary-foreground font-semibold'
                  : 'border-border hover:bg-muted text-muted-foreground'
              }`}
            >
              Serif
            </button>
            <button
              onClick={() => setReaderFont('sans')}
              className={`px-2 py-1.5 text-xs rounded-md border text-center transition-colors cursor-pointer ${
                readerFont === 'sans'
                  ? 'border-primary bg-primary text-primary-foreground font-semibold'
                  : 'border-border hover:bg-muted text-muted-foreground'
              }`}
            >
              Sans
            </button>
            <button
              onClick={() => setReaderFont('mono')}
              className={`px-2 py-1.5 text-xs rounded-md border text-center transition-colors font-mono cursor-pointer ${
                readerFont === 'mono'
                  ? 'border-primary bg-primary text-primary-foreground font-semibold'
                  : 'border-border hover:bg-muted text-muted-foreground'
              }`}
            >
              Mono
            </button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Font Size Stepper */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Font Size</span>
          <div className="flex items-center gap-1.5 bg-muted/60 rounded-md p-0.5 border border-border">
            <button
              onClick={() => setReaderFontSize((s) => Math.max(14, s - 1))}
              className="h-6 w-6 rounded flex items-center justify-center hover:bg-background text-xs cursor-pointer font-bold"
              title="Decrease size"
            >
              −
            </button>
            <span className="w-7 text-center font-mono text-xs font-semibold">
              {readerFontSize}
            </span>
            <button
              onClick={() => setReaderFontSize((s) => Math.min(24, s + 1))}
              className="h-6 w-6 rounded flex items-center justify-center hover:bg-background text-xs cursor-pointer font-bold"
              title="Increase size"
            >
              +
            </button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Atmosphere Tint */}
        <div className="space-y-1">
          <DropdownMenuLabel className="p-0 text-xs font-semibold text-foreground">
            Atmosphere Tint
          </DropdownMenuLabel>
          <div className="grid grid-cols-3 gap-1 pt-1">
            <button
              onClick={() => setReaderTint('default')}
              className={`px-2 py-1 text-xs rounded-md border text-center transition-colors cursor-pointer ${
                readerTint === 'default'
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 font-semibold'
                  : 'border-border hover:bg-muted text-muted-foreground'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setReaderTint('sepia')}
              className={`px-2 py-1 text-xs rounded-md border text-center transition-colors cursor-pointer bg-[#fbf7ee] dark:bg-[#1a1713] text-[#78593a] dark:text-[#d3c0a5] ${
                readerTint === 'sepia' ? 'border-[#b89569] ring-1 ring-[#b89569] font-semibold' : 'border-border'
              }`}
              title="Warm paper tone to eliminate eye fatigue"
            >
              Warm Sepia
            </button>
            <button
              onClick={() => setReaderTint('midnight')}
              className={`px-2 py-1 text-xs rounded-md border text-center transition-colors cursor-pointer bg-black text-zinc-300 ${
                readerTint === 'midnight' ? 'border-zinc-400 ring-1 ring-zinc-400 font-semibold' : 'border-border'
              }`}
            >
              Midnight
            </button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Width & Focus Spotlight */}
        <div className="space-y-2 pt-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Optimal Column (68ch)</span>
            <button
              onClick={() => setReaderWidth((w) => (w === 'optimal' ? 'wide' : 'optimal'))}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                readerWidth === 'optimal'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {readerWidth === 'optimal' ? 'Optimal' : 'Wide'}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground" title="Dopamine focus aid: dims neighboring blocks while reading">
              Focus Spotlight
            </span>
            <button
              onClick={() => setFocusSpotlight((s) => !s)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                focusSpotlight
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {focusSpotlight ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Component: Outline Menu Dropdown
  const OutlineMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
          title="Chapter Outline & Headings"
        >
          <List className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Outline</span>
          {headings.length > 0 && (
            <span className="text-[10px] text-muted-foreground font-mono">({headings.length})</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto p-2">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1">
          Table of Headings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {headings.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground text-center">No headings in this chapter.</p>
        ) : (
          headings.map((h, i) => (
            <DropdownMenuItem
              key={i}
              onClick={() => scrollToHeading(h.text)}
              className={`text-xs cursor-pointer truncate py-1.5 ${
                h.level === 1 ? 'font-bold pl-2' : h.level === 2 ? 'font-medium pl-4' : 'text-muted-foreground pl-6'
              }`}
            >
              {h.text}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // FULLSCREEN IMMERSION FOCUS MODE
  if (isFocusMode) {
    return (
      <div
        ref={articleContainerRef}
        className={`fixed inset-0 z-50 overflow-y-auto ${tintClass} ${
          tintClass ? '' : 'bg-background text-foreground'
        } transition-colors duration-200 select-text`}
      >
        {/* Top Reading Progress Line */}
        <div
          className="fixed top-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />

        {/* Floating Minimal Zen HUD */}
        <div className="sticky top-4 z-40 max-w-xl mx-auto px-4 pointer-events-none">
          <div className="flex items-center justify-between gap-3 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-md border border-border/80 shadow-lg rounded-full px-4 py-1.5 pointer-events-auto transition-transform hover:scale-[1.01]">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFocusMode(false)}
                className="h-6 w-6 rounded-full hover:bg-muted cursor-pointer shrink-0"
                title="Exit Focus Mode (Esc)"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-semibold truncate text-foreground">
                {chapter.title}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                <span>{scrollProgress}%</span>
                <span>•</span>
                <span>~{remainingMinutes}m left</span>
              </div>

              <Separator orientation="vertical" className="h-3.5" />

              <OutlineMenu />
              <AppearanceMenu />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFocusMode(false)}
                className="h-6 w-6 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                title="Exit Focus Mode (Esc)"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Focus Article Content */}
        <article className={`${widthClass} mx-auto px-6 py-12 space-y-8`}>
          <header className="space-y-4 text-center pb-6 border-b border-border/60">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline">{chapter.subjectTitle}</Badge>
              {currentIndex >= 0 && chapters.length > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  Chapter {currentIndex + 1} of {chapters.length}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              {chapter.title}
            </h1>

            {chapter.summary && (
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto font-normal">
                {chapter.summary}
              </p>
            )}

            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {chapter.estimatedMinutes} min read
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {new Date(chapter.createdAtUtc).toLocaleDateString()}
              </span>
            </div>
          </header>

          {/* Body Content */}
          <div className={`pt-2 ${focusSpotlight ? 'reader-focus-spotlight' : ''}`}>
            <RichContentRenderer
              content={chapter.content}
              fontFamily={readerFont}
              fontSize={readerFontSize}
            />
          </div>

          {/* Chapter Adjacent Navigation */}
          <div className="mt-16 pt-8 border-t border-border space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevChapter ? (
                <Link
                  to={`/read/${prevChapter.id}`}
                  className="group flex items-center gap-3 p-4 rounded-xl border border-border hover:border-zinc-700 transition-all text-left bg-card/60"
                >
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:-translate-x-0.5 transition-transform shrink-0">
                    <ChevronLeft className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Previous Chapter
                    </p>
                    <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-indigo-400 transition-colors">
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
                  className="group flex items-center justify-end gap-3 p-4 rounded-xl border border-border hover:border-zinc-700 transition-all text-right bg-card/60"
                >
                  <div className="overflow-hidden text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Next Chapter
                    </p>
                    <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-indigo-400 transition-colors">
                      {nextChapter.title}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              ) : (
                <div className="hidden sm:block" />
              )}
            </div>

            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFocusMode(false)}
                className="text-xs text-muted-foreground"
              >
                <Minimize2 className="h-3.5 w-3.5 mr-1.5" />
                Exit Focus Mode (Esc)
              </Button>
            </div>
          </div>
        </article>
      </div>
    )
  }

  // STANDARD READING VIEW
  return (
    <>
      {/* Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className={`${widthClass} mx-auto space-y-6 py-4`}>
        {/* Top Navigation & Controls Bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-3.5 gap-2">
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="hover:text-foreground transition-colors">Library</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbLink asChild>
                  <Link
                    to={`/subjects/${chapter.subjectId}`}
                    className="hover:text-foreground transition-colors truncate max-w-[140px] sm:max-w-[220px] block"
                  >
                    {chapter.subjectTitle || 'Subject'}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Action buttons: Focus Read, Appearance, Outline, Share, Edit */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {/* Prominent Focus Mode Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsFocusMode(true)
                toast.info('Focus Mode enabled. Press Esc or F to exit.')
              }}
              className="h-7 px-2.5 text-xs gap-1.5 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer font-medium shadow-2xs"
              title="Toggle Distraction-free Focus Read (F)"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>Focus Read</span>
              <kbd className="hidden sm:inline-block ml-0.5 px-1 py-0.2 bg-muted text-[9px] rounded font-mono text-muted-foreground">
                F
              </kbd>
            </Button>

            {/* Presentation Mode Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/present/${chapter.id}`)}
              className="h-7 px-2.5 text-xs gap-1.5 border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 cursor-pointer font-medium shadow-2xs"
              title="Launch Slide Presentation (P)"
            >
              <Presentation className="h-3.5 w-3.5 text-purple-500" />
              <span>Present</span>
              <kbd className="hidden sm:inline-block ml-0.5 px-1 py-0.2 bg-muted text-[9px] rounded font-mono text-muted-foreground">
                P
              </kbd>
            </Button>

            <OutlineMenu />
            <AppearanceMenu />

            <Separator orientation="vertical" className="h-4 mx-0.5 hidden sm:block" />

            <button
              onClick={handleShare}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Copy share link"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <Link to={`/write?chapterId=${chapter.id}&subjectId=${chapter.subjectId}`}>
              <button
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Edit chapter content"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Reader Paper Canvas / Document */}
        <article
          className={`space-y-8 p-6 sm:p-10 rounded-2xl transition-all duration-200 ${
            tintClass
              ? `${tintClass} border shadow-md`
              : 'bg-card border border-border/70 shadow-xs'
          }`}
        >
          {/* Header Info */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{chapter.subjectTitle}</Badge>
            {currentIndex >= 0 && chapters.length > 0 && (
              <Badge variant="secondary" className="text-xs font-normal">
                Chapter {currentIndex + 1} of {chapters.length}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 ml-1">
              <Clock className="h-3.5 w-3.5" />
              {chapter.estimatedMinutes > 0 ? `${chapter.estimatedMinutes} min read` : '1 min read'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {chapter.title}
          </h1>

          {chapter.summary && (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
              {chapter.summary}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-b border-border pb-6">
            <Calendar className="h-3.5 w-3.5" />
            <span>Published on {new Date(chapter.createdAtUtc).toLocaleDateString()}</span>
          </div>
        </header>

        {/* Rendered Chapter Content with Inherited Typography */}
        <div className={`pt-2 ${focusSpotlight ? 'reader-focus-spotlight' : ''}`}>
          <RichContentRenderer
            content={chapter.content}
            fontFamily={readerFont}
            fontSize={readerFontSize}
          />
        </div>

        {/* Chapter Pagination / Adjacent Navigation */}
        <div className="mt-14 pt-8 border-t border-border space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevChapter ? (
              <Link
                to={`/read/${prevChapter.id}`}
                className="group flex items-center gap-3 p-4 rounded-xl border border-border hover:border-zinc-700 transition-all text-left bg-card"
              >
                <div className="h-8 w-8 rounded-lg bg-muted dark:bg-zinc-800 flex items-center justify-center text-muted-foreground group-hover:-translate-x-0.5 transition-transform shrink-0">
                  <ChevronLeft className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Previous Chapter
                  </p>
                  <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-indigo-400 transition-colors">
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
                className="group flex items-center justify-end gap-3 p-4 rounded-xl border border-border hover:border-zinc-700 transition-all text-right bg-card"
              >
                <div className="overflow-hidden text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Next Chapter
                  </p>
                  <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-indigo-400 transition-colors">
                    {nextChapter.title}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-muted dark:bg-zinc-800 flex items-center justify-center text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}
          </div>
        </div>
      </article>
    </div>
  </>
  )
}
