import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Clock,
  LayoutGrid,
  RotateCcw,
  Presentation,
  Flame,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchChapterById } from '@/lib/api'
import { RichContentRenderer } from '@/components/content/RichContentRenderer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export interface SlideData {
  id: number
  title: string
  content: string
  isCover?: boolean
}

/**
 * Intelligent Slide Splitter:
 * 1. Checks if the author included explicit slide dividers (`---` or `___`).
 * 2. If not, automatically chunks content by major headings (`# ` and `## `).
 * 3. Prepends a handsome Title / Cover slide.
 */
function parseChapterIntoSlides(
  title: string,
  summary: string,
  content: string
): SlideData[] {
  const slides: SlideData[] = []

  // 1. Cover Slide
  slides.push({
    id: 0,
    title: title,
    content: summary || 'Interactive technical presentation and curriculum notes.',
    isCover: true,
  })

  if (!content || !content.trim()) {
    return slides
  }

  // 2. Check for explicit `---` or `___` dividers
  const hasExplicitDividers = /(?:^|\n)\s*(?:---|___)\s*(?:\n|$)/.test(content)

  if (hasExplicitDividers) {
    const rawChunks = content.split(/(?:^|\n)\s*(?:---|___)\s*(?:\n|$)/)
    let slideIdx = 1
    for (const chunk of rawChunks) {
      const trimmed = chunk.trim()
      if (!trimmed) continue
      // Extract slide title from the first heading if present
      const headingMatch = trimmed.match(/^#+\s*(.+)$/m)
      const slideTitle = headingMatch ? headingMatch[1].trim() : `Section ${slideIdx}`
      slides.push({
        id: slideIdx++,
        title: slideTitle,
        content: trimmed,
      })
    }
  } else {
    // Auto-split by headings (`# ` and `## `)
    const lines = content.split('\n')
    let currentSlideTitle = 'Overview'
    let currentSlideLines: string[] = []
    let slideIdx = 1

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,2})\s+(.+)$/)
      if (headingMatch && currentSlideLines.length > 0) {
        // Push previous accumulated slide
        slides.push({
          id: slideIdx++,
          title: currentSlideTitle,
          content: currentSlideLines.join('\n').trim(),
        })
        currentSlideTitle = headingMatch[2].trim()
        currentSlideLines = [line]
      } else {
        if (headingMatch) {
          currentSlideTitle = headingMatch[2].trim()
        }
        currentSlideLines.push(line)
      }
    }

    if (currentSlideLines.length > 0 && currentSlideLines.join('').trim()) {
      slides.push({
        id: slideIdx++,
        title: currentSlideTitle,
        content: currentSlideLines.join('\n').trim(),
      })
    }
  }

  return slides
}

export function ChapterPresentationView() {
  const { chapterId } = useParams<{ chapterId: string }>()
  const navigate = useNavigate()

  const { data: chapter, isLoading, error } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: () => (chapterId ? fetchChapterById(chapterId) : Promise.reject('No ID')),
    enabled: !!chapterId,
  })

  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [laserActive, setLaserActive] = React.useState(false)
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 })
  const [showOverviewGrid, setShowOverviewGrid] = React.useState(false)
  const [timerSeconds, setTimerSeconds] = React.useState(0)
  const [timerRunning] = React.useState(true)

  // Parse slides
  const slides = React.useMemo(() => {
    if (!chapter) return []
    return parseChapterIntoSlides(
      chapter.title,
      chapter.summary,
      chapter.content
    )
  }, [chapter])

  const totalSlides = slides.length
  const currentSlide = slides[currentSlideIndex] || slides[0]

  // Presentation stopwatch timer
  React.useEffect(() => {
    if (!timerRunning) return
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [timerRunning])

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`
  }

  // Fullscreen toggle
  const toggleFullscreen = React.useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }, [])

  // Sync fullscreen state with external esc key
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Next and Prev handlers
  const handleNext = React.useCallback(() => {
    setCurrentSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1))
  }, [totalSlides])

  const handlePrev = React.useCallback(() => {
    setCurrentSlideIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const handleExit = React.useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
    navigate(`/read/${chapterId}`)
  }, [navigate, chapterId])

  // Keyboard navigation shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'Home') {
        e.preventDefault()
        setCurrentSlideIndex(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        setCurrentSlideIndex(totalSlides - 1)
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFullscreen()
      } else if (e.key === 'Escape') {
        if (!showOverviewGrid) {
          handleExit()
        } else {
          setShowOverviewGrid(false)
        }
      } else if (e.key === 'l' || e.key === 'L') {
        setLaserActive((prev) => !prev)
      } else if (e.key === 'o' || e.key === 'O' || e.key === 'g' || e.key === 'G') {
        setShowOverviewGrid((prev) => !prev)
      } else if (e.key === 't' || e.key === 'T') {
        setTimerSeconds(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev, toggleFullscreen, handleExit, totalSlides, showOverviewGrid])

  // Laser Pointer Mouse Tracker
  const handleMouseMove = (e: React.MouseEvent) => {
    if (laserActive) {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-8 space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
        <Skeleton className="h-64 w-full max-w-3xl rounded-2xl" />
      </div>
    )
  }

  if (error || !chapter) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-destructive font-medium">Failed to load presentation.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    )
  }

  const progressPercent = totalSlides > 1 ? ((currentSlideIndex + 1) / totalSlides) * 100 : 100

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-50 select-none overflow-hidden transition-colors ${
        laserActive ? 'cursor-none' : ''
      }`}
    >
      {/* Laser Pointer Dot */}
      {laserActive && (
        <div
          className="fixed pointer-events-none z-50 rounded-full bg-red-500 shadow-[0_0_16px_6px_rgba(239,68,68,0.85)]"
          style={{
            width: '12px',
            height: '12px',
            left: `${mousePos.x - 6}px`,
            top: `${mousePos.y - 6}px`,
            transition: 'transform 0.05s ease-out',
          }}
        />
      )}

      {/* Top Header Bar */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Badge variant="outline" className="border-zinc-700 text-zinc-300 font-normal">
            {chapter.subjectTitle || 'Subject'}
          </Badge>
          <span className="text-zinc-600">•</span>
          <span className="text-xs font-semibold text-zinc-300 truncate max-w-sm">
            {chapter.title}
          </span>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2">
          {/* Laser Pointer Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLaserActive((prev) => !prev)}
            className={`h-8 px-2.5 text-xs gap-1.5 transition-colors ${
              laserActive
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
            title="Toggle Laser Pointer (L)"
          >
            <Flame className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Laser</span>
          </Button>

          {/* Slide Overview Grid */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOverviewGrid(true)}
            className="h-8 px-2.5 text-xs gap-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            title="Slide Overview Grid (G)"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Slides</span>
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Exit Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExit}
            className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            title="Exit Presentation (Esc)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Slide Canvas */}
      <main className="flex-1 overflow-y-auto px-6 sm:px-12 md:px-20 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto min-h-[420px] flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200">
          {currentSlide?.isCover ? (
            /* Cover Slide */
            <div className="text-center space-y-6 sm:space-y-8 py-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 text-xs font-medium">
                <Presentation className="h-3.5 w-3.5" />
                <span>{chapter.subjectTitle || 'EffectiveLearn Curriculum'}</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
                {chapter.title}
              </h1>

              {chapter.summary && (
                <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                  {chapter.summary}
                </p>
              )}

              <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 pt-4">
                <span>Total Slides: {totalSlides}</span>
                <span>•</span>
                <span>~{chapter.estimatedMinutes || 5} min read</span>
              </div>

              <div className="pt-6">
                <Button
                  onClick={handleNext}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20"
                >
                  <span>Start Presentation</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <p className="text-[11px] text-zinc-500 mt-3 font-mono">
                  Press Space or → to advance
                </p>
              </div>
            </div>
          ) : (
            /* Content Slide */
            <div className="space-y-6">
              {/* Slide Heading */}
              <div className="border-b border-zinc-800 pb-4">
                <div className="text-xs uppercase tracking-wider text-indigo-400 font-semibold mb-1">
                  Slide {currentSlideIndex + 1} of {totalSlides}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {currentSlide?.title}
                </h2>
              </div>

              {/* Slide Body */}
              <div className="text-zinc-200 text-base sm:text-lg leading-relaxed">
                <RichContentRenderer content={currentSlide?.content || ''} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Slide Navigation Progress Bar */}
      <div className="h-1 w-full bg-zinc-800 shrink-0">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Bottom Presenter Toolbar */}
      <footer className="h-16 px-6 sm:px-10 flex items-center justify-between border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md shrink-0">
        {/* Left: Slide Indicator */}
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="bg-zinc-800 text-zinc-200 font-mono text-xs px-2.5 py-0.5"
          >
            {currentSlideIndex + 1} / {totalSlides}
          </Badge>
          <span className="hidden md:inline text-xs text-zinc-400 truncate max-w-[200px]">
            {currentSlide?.title}
          </span>
        </div>

        {/* Center: Prev / Next Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className="h-8 px-3 text-xs gap-1 border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
            title="Previous Slide (← or PageUp)"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentSlideIndex === totalSlides - 1}
            className="h-8 px-3 text-xs gap-1 border-indigo-500/40 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 disabled:opacity-30 cursor-pointer font-medium"
            title="Next Slide (→ or Space)"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Right: Stopwatch Timer */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimerSeconds(0)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors"
            title="Click to reset timer (T)"
          >
            <Clock className="h-3 w-3 text-indigo-400" />
            <span>{formatTimer(timerSeconds)}</span>
            <RotateCcw className="h-2.5 w-2.5 opacity-50 hover:opacity-100 ml-0.5" />
          </button>
        </div>
      </footer>

      {/* Slide Overview Grid Modal */}
      {showOverviewGrid && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-6 sm:p-12 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Slide Deck Overview</h3>
              <p className="text-xs text-zinc-400">
                Click any slide to jump directly to it ({totalSlides} slides total)
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowOverviewGrid(false)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
            {slides.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => {
                  setCurrentSlideIndex(idx)
                  setShowOverviewGrid(false)
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  idx === currentSlideIndex
                    ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                    <span className="font-mono">#{idx + 1}</span>
                    {s.isCover && (
                      <span className="text-indigo-400 font-medium">Cover</span>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm line-clamp-2">{s.title}</h4>
                </div>
                <p className="text-xs text-zinc-500 line-clamp-3 mt-3 font-mono">
                  {s.content.replace(/[#*`>-]/g, '').slice(0, 100)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
