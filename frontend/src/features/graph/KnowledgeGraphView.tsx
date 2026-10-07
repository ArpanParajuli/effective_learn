import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import {
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Search,
  ArrowRight,
  Layers,
  Sparkles,
  Info,
  X,
  Clock,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchSubjects, fetchAllChapters } from '@/lib/api'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'

// Graph Data Types
export interface GraphNode extends SimulationNodeDatum {
  id: string
  title: string
  type: 'subject' | 'chapter'
  subjectId?: string
  subjectTitle?: string
  summary?: string
  color: string
  radius: number
  chapterCount?: number
  estimatedMinutes?: number
}

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode
  target: string | GraphNode
}

const SUBJECT_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#8b5cf6', // Violet
]

export function KnowledgeGraphView() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  const [selectedNode, setSelectedNode] = React.useState<GraphNode | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [activeSubjectFilter, setActiveSubjectFilter] = React.useState<string>('all')

  // Refs to avoid simulation thrashing
  const themeRef = React.useRef(theme)
  const searchQueryRef = React.useRef(searchQuery)
  const selectedNodeRef = React.useRef<GraphNode | null>(selectedNode)
  const hoveredNodeRef = React.useRef<GraphNode | null>(null)
  const transformRef = React.useRef({ x: 0, y: 0, k: 1 })
  const renderRef = React.useRef<() => void>(() => {})
  const simulationRef = React.useRef<any>(null)
  const nodesRef = React.useRef<GraphNode[]>([])
  const linksRef = React.useRef<GraphLink[]>([])

  // Keep refs in sync
  React.useEffect(() => {
    themeRef.current = theme
    renderRef.current()
  }, [theme])

  React.useEffect(() => {
    searchQueryRef.current = searchQuery
    renderRef.current()
  }, [searchQuery])

  React.useEffect(() => {
    selectedNodeRef.current = selectedNode
    renderRef.current()
  }, [selectedNode])

  // Fetch subjects and all chapters
  const { data: rawSubjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  })

  const { data: rawChapters = [], isLoading: loadingChapters } = useQuery({
    queryKey: ['all-chapters'],
    queryFn: fetchAllChapters,
  })

  const subjects = Array.isArray(rawSubjects) ? rawSubjects : []
  const chapters = Array.isArray(rawChapters) ? rawChapters : []
  const isLoading = loadingSubjects || loadingChapters

  // Build Graph Nodes and Links
  const graphData = React.useMemo(() => {
    const nodes: GraphNode[] = []
    const links: GraphLink[] = []

    const subjectColorMap = new Map<string, string>()

    subjects.forEach((s, idx) => {
      const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length]
      subjectColorMap.set(s.id, color)

      nodes.push({
        id: s.id,
        title: s.title,
        type: 'subject',
        color,
        radius: 26,
        chapterCount: s.chapterCount,
        summary: s.description,
      })
    })

    chapters.forEach((c) => {
      const color = subjectColorMap.get(c.subjectId) || '#64748b'
      const parentSubject = subjects.find((s) => s.id === c.subjectId)

      nodes.push({
        id: c.id,
        title: c.title,
        type: 'chapter',
        subjectId: c.subjectId,
        subjectTitle: parentSubject?.title || 'Subject',
        color,
        radius: 14,
        summary: c.summary,
        estimatedMinutes: c.estimatedMinutes,
      })

      // Link to parent subject
      if (nodes.some((n) => n.id === c.subjectId)) {
        links.push({
          source: c.subjectId,
          target: c.id,
        })
      }
    })

    return { nodes, links }
  }, [subjects, chapters])

  // Filter nodes if subject filter is active
  const filteredData = React.useMemo(() => {
    if (activeSubjectFilter === 'all') return graphData

    const subjectNode = graphData.nodes.find((n) => n.id === activeSubjectFilter)
    if (!subjectNode) return graphData

    const validNodeIds = new Set<string>([subjectNode.id])
    graphData.nodes.forEach((n) => {
      if (n.type === 'chapter' && n.subjectId === activeSubjectFilter) {
        validNodeIds.add(n.id)
      }
    })

    const filteredNodes = graphData.nodes.filter((n) => validNodeIds.has(n.id))
    const filteredLinks = graphData.links.filter((l) => {
      const srcId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source
      const tgtId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target
      return validNodeIds.has(srcId as string) && validNodeIds.has(tgtId as string)
    })

    return { nodes: filteredNodes, links: filteredLinks }
  }, [graphData, activeSubjectFilter])

  // Stable Simulation Lifecycle
  React.useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || filteredData.nodes.length === 0) return

    const width = container.clientWidth || 900
    const height = container.clientHeight || 600

    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Preserve existing coordinates when filtering or reloading so nodes don't jump
    const existingCoords = new Map<string, { x: number; y: number; vx: number; vy: number }>()
    nodesRef.current.forEach((n) => {
      if (n.x !== undefined && n.y !== undefined) {
        existingCoords.set(n.id, { x: n.x, y: n.y, vx: n.vx || 0, vy: n.vy || 0 })
      }
    })

    const nodes: GraphNode[] = filteredData.nodes.map((d) => {
      const prev = existingCoords.get(d.id)
      return {
        ...d,
        x: prev ? prev.x : width / 2 + (Math.random() - 0.5) * 200,
        y: prev ? prev.y : height / 2 + (Math.random() - 0.5) * 200,
        vx: prev ? prev.vx : 0,
        vy: prev ? prev.vy : 0,
      }
    })

    const links: GraphLink[] = filteredData.links.map((d) => ({ ...d }))

    nodesRef.current = nodes
    linksRef.current = links

    // Stop prior simulation
    if (simulationRef.current) {
      simulationRef.current.stop()
    }

    // High stability D3 force simulation with rapid cooling
    const simulation = forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(90)
      )
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide().radius((d: any) => d.radius + 14))
      .alpha(0.6)
      .alphaDecay(0.04) // Cools down quickly to eliminate bouncing
      .velocityDecay(0.4) // High damping for calm, rock-solid motion

    simulationRef.current = simulation

    // Canvas Draw Routine
    const draw = () => {
      if (!ctx || !canvas) return
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

      const t = transformRef.current
      ctx.translate(t.x, t.y)
      ctx.scale(t.k, t.k)

      const curTheme = themeRef.current
      const isDark =
        curTheme === 'dark' ||
        (curTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

      const curQuery = searchQueryRef.current.trim().toLowerCase()
      const curSelected = selectedNodeRef.current
      const curHovered = hoveredNodeRef.current

      // 1. Draw Links
      ctx.lineWidth = 1.5
      links.forEach((link) => {
        const source = link.source as GraphNode
        const target = link.target as GraphNode
        if (source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) return

        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)

        const isDimmed =
          curQuery !== '' &&
          !source.title.toLowerCase().includes(curQuery) &&
          !target.title.toLowerCase().includes(curQuery)

        ctx.strokeStyle = isDimmed
          ? isDark
            ? 'rgba(255, 255, 255, 0.03)'
            : 'rgba(0, 0, 0, 0.03)'
          : isDark
          ? 'rgba(255, 255, 255, 0.15)'
          : 'rgba(15, 23, 42, 0.12)'
        ctx.stroke()
      })

      // 2. Draw Nodes
      nodes.forEach((node) => {
        if (node.x === undefined || node.y === undefined) return

        const isHovered = curHovered?.id === node.id
        const isSelected = curSelected?.id === node.id
        const isSearchMatch = curQuery !== '' && node.title.toLowerCase().includes(curQuery)

        const r = node.radius * (isHovered || isSelected ? 1.25 : 1)

        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
        ctx.fillStyle = node.color
        ctx.fill()

        // Ring / Glow
        if (isSelected || isSearchMatch) {
          ctx.lineWidth = 3
          ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a'
          ctx.stroke()
        } else if (isHovered) {
          ctx.lineWidth = 2
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.5)'
          ctx.stroke()
        }

        // Draw Labels
        ctx.font = node.type === 'subject' ? '600 12px -apple-system, system-ui' : '500 10px -apple-system, system-ui'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'

        const labelColor = isDark
          ? isHovered || isSelected || isSearchMatch
            ? '#ffffff'
            : '#94a3b8'
          : isHovered || isSelected || isSearchMatch
          ? '#0f172a'
          : '#475569'

        ctx.fillStyle = labelColor

        const displayTitle =
          node.title.length > 22 ? `${node.title.slice(0, 20)}…` : node.title
        ctx.fillText(displayTitle, node.x, node.y + r + 4)
      })

      ctx.restore()
    }

    renderRef.current = draw
    simulation.on('tick', draw)

    // Touch & Pointer Interaction Handler
    let isDraggingNode = false
    let isPanning = false
    let draggedNode: GraphNode | null = null
    let startPointerPos = { x: 0, y: 0 }
    let hasMoved = false

    const getVirtualCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = clientX - rect.left
      const mouseY = clientY - rect.top
      const t = transformRef.current
      return {
        x: (mouseX - t.x) / t.k,
        y: (mouseY - t.y) / t.k,
        screenX: mouseX,
        screenY: mouseY,
      }
    }

    const findNodeAt = (vx: number, vy: number): GraphNode | null => {
      for (const node of nodes) {
        if (node.x === undefined || node.y === undefined) continue
        const dist = Math.hypot(node.x - vx, node.y - vy)
        if (dist <= node.radius + 8) {
          return node
        }
      }
      return null
    }

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId)
      const { x: vx, y: vy, screenX, screenY } = getVirtualCoords(e.clientX, e.clientY)
      startPointerPos = { x: screenX, y: screenY }
      hasMoved = false

      const hit = findNodeAt(vx, vy)
      if (hit) {
        isDraggingNode = true
        draggedNode = hit
        hit.fx = hit.x
        hit.fy = hit.y
        simulation.alphaTarget(0.2).restart()
      } else {
        isPanning = true
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      const { x: vx, y: vy, screenX, screenY } = getVirtualCoords(e.clientX, e.clientY)

      if (Math.hypot(screenX - startPointerPos.x, screenY - startPointerPos.y) > 4) {
        hasMoved = true
      }

      if (isDraggingNode && draggedNode) {
        draggedNode.fx = vx
        draggedNode.fy = vy
        draw()
        return
      }

      if (isPanning) {
        const dx = screenX - startPointerPos.x
        const dy = screenY - startPointerPos.y
        startPointerPos = { x: screenX, y: screenY }
        transformRef.current.x += dx
        transformRef.current.y += dy
        draw()
        return
      }

      // Hover check without restarting simulation
      const hit = findNodeAt(vx, vy)
      if (hit?.id !== hoveredNodeRef.current?.id) {
        hoveredNodeRef.current = hit
        canvas.style.cursor = hit ? 'pointer' : 'default'
        draw()
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        // ignore
      }

      if (!hasMoved) {
        const { x: vx, y: vy } = getVirtualCoords(e.clientX, e.clientY)
        const hit = findNodeAt(vx, vy)
        setSelectedNode(hit)
      }

      if (isDraggingNode && draggedNode) {
        draggedNode.fx = null
        draggedNode.fy = null
        draggedNode = null
        simulation.alphaTarget(0)
      }

      isDraggingNode = false
      isPanning = false
      draw()
    }

    // Wheel Zoom handler with smooth scaling around cursor
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85
      const newScale = Math.min(Math.max(transformRef.current.k * zoomFactor, 0.25), 4)

      // Keep point under cursor invariant
      const t = transformRef.current
      t.x = mouseX - (mouseX - t.x) * (newScale / t.k)
      t.y = mouseY - (mouseY - t.y) * (newScale / t.k)
      t.k = newScale

      draw()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      simulation.stop()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [filteredData])

  // Zoom Helpers
  const handleZoomIn = () => {
    transformRef.current.k = Math.min(transformRef.current.k * 1.3, 4)
    renderRef.current()
  }

  const handleZoomOut = () => {
    transformRef.current.k = Math.max(transformRef.current.k * 0.7, 0.25)
    renderRef.current()
  }

  const handleResetZoom = () => {
    transformRef.current = { x: 0, y: 0, k: 1 }
    renderRef.current()
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Knowledge Graph
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Visualize all technical subjects, articles, and interconnected concepts in your learning universe.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5" />
              <span>Grid View</span>
            </Button>
          </Link>
          <Link to="/write">
            <Button size="sm" className="gap-1.5 text-xs">
              <span>Write Chapter</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search in Graph */}
        <div className="w-full md:w-80">
          <InputGroup className="h-9">
            <InputGroupAddon placement="left" className="px-2.5">
              <Search className="h-3.5 w-3.5 text-slate-400" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search concepts, nodes, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="pr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </InputGroup>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <button
            onClick={() => setActiveSubjectFilter('all')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
              activeSubjectFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Categories ({subjects.length})
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSubjectFilter(s.id)}
              className={`rounded-lg px-2.5 py-1 font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeSubjectFilter === s.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[620px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#07080c] overflow-hidden shadow-sm touch-none"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <p className="text-xs text-slate-400">Assembling knowledge graph physics simulation...</p>
          </div>
        ) : (
          <canvas ref={canvasRef} className="w-full h-full block cursor-default" />
        )}

        {/* Floating Navigation / Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 bg-white/90 dark:bg-[#11131a]/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-md">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reset View"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 bg-white/80 dark:bg-[#11131a]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm text-xs space-y-2 pointer-events-none sm:pointer-events-auto">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-slate-400" /> Legend
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-indigo-500 inline-block" />
              <span>Subject Category Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400 inline-block" />
              <span>Chapter / Concept Node</span>
            </div>
          </div>
        </div>

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <Card className="absolute top-4 right-4 w-80 max-w-[calc(100%-2rem)] bg-white/95 dark:bg-[#11131a]/95 backdrop-blur-lg border border-slate-200 dark:border-slate-800 shadow-xl p-4 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-2">
              <Badge
                variant="outline"
                className="text-[10px] capitalize font-medium"
                style={{ borderColor: selectedNode.color, color: selectedNode.color }}
              >
                {selectedNode.type}
              </Badge>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {selectedNode.title}
              </h3>
              {selectedNode.subjectTitle && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Part of {selectedNode.subjectTitle}
                </p>
              )}
            </div>

            {selectedNode.summary && (
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                {selectedNode.summary}
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              {selectedNode.type === 'chapter' ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {selectedNode.estimatedMinutes || 5} min read
                </span>
              ) : (
                <span>{selectedNode.chapterCount || 0} chapters linked</span>
              )}

              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  if (selectedNode.type === 'chapter') {
                    navigate(`/read/${selectedNode.id}`)
                  } else {
                    navigate(`/subjects/${selectedNode.id}`)
                  }
                }}
              >
                <span>{selectedNode.type === 'chapter' ? 'Read' : 'Explore'}</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Helpful Hint */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Touch or drag nodes to reposition. Drag canvas to pan. Scroll to zoom. Click any node to inspect.</span>
        <span>{filteredData.nodes.length} nodes connected</span>
      </div>
    </div>
  )
}
