import * as React from 'react'
import { Link } from 'react-router-dom'
import { Plus, BookOpen, Layers, Server, Database, ChevronRight, Search, X, Network } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSubjects, createSubject } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { toast } from 'sonner'

const SUBJECTS_PER_PAGE = 6

function getPaginationRange(current: number, total: number) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages: (number | 'ellipsis')[] = []
  if (current <= 3) {
    pages.push(1, 2, 3, 4, 'ellipsis', total)
  } else if (current >= total - 2) {
    pages.push(1, 'ellipsis', total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total)
  }
  return pages
}

export function SubjectsPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState('')
  const [newDescription, setNewDescription] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const { data: rawSubjects, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  })

  const subjects = Array.isArray(rawSubjects) ? rawSubjects : []

  // Filter subjects in real-time
  const filteredSubjects = React.useMemo(() => {
    if (!searchQuery.trim()) return subjects
    const q = searchQuery.toLowerCase().trim()
    return subjects.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    )
  }, [subjects, searchQuery])

  // Reset to page 1 on search change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / SUBJECTS_PER_PAGE))
  const startIndex = (currentPage - 1) * SUBJECTS_PER_PAGE
  const paginatedSubjects = filteredSubjects.slice(startIndex, startIndex + SUBJECTS_PER_PAGE)

  // Keyboard shortcut to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setShowModal(false)
      setNewTitle('')
      setNewDescription('')
      toast.success('Subject category created!')
    },
    onError: () => {
      toast.error('Failed to create subject.')
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    createMutation.mutate({
      title: newTitle.trim(),
      description: newDescription.trim(),
      icon: 'BookOpen',
    })
  }

  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Server':
        return Server
      case 'Layers':
        return Layers
      case 'Database':
        return Database
      default:
        return BookOpen
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Knowledge Subjects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse through your curated technical subjects, chapters, notes, and video tutorials.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:self-end">
          <Link to="/graph">
            <Button variant="outline" className="gap-2">
              <Network className="h-4 w-4" />
              <span>Concept Graph</span>
            </Button>
          </Link>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            New Subject
          </Button>
        </div>
      </div>

      {/* Search Bar with InputGroup */}
      <div className="max-w-md">
        <InputGroup>
          <InputGroupAddon placement="left">
            <Search className="h-4 w-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchInputRef}
            placeholder="Search subjects, topics, or notes... (Press / to search)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <div className="pr-2 flex items-center">
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </InputGroup>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
              <div className="pt-2 flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">No subjects yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first subject to start writing chapters.</p>
          <Button onClick={() => setShowModal(true)} size="sm" className="mt-4">
            Create Subject
          </Button>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
          <Search className="h-7 w-7 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            No subjects matching "{searchQuery}"
          </p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your query or clear the search to view all subjects.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paginatedSubjects.map((subject) => {
              const Icon = getSubjectIcon(subject.icon)

              return (
                <Link
                  key={subject.id}
                  to={`/subjects/${subject.id}`}
                  className="group block"
                >
                  <Card className="h-full flex flex-col justify-between hover:border-zinc-700 transition-all bg-card">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted dark:bg-zinc-800 text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </div>
                        <Badge variant="outline">
                          {subject.chapterCount} {subject.chapterCount === 1 ? 'Chapter' : 'Chapters'}
                        </Badge>
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-indigo-400 transition-colors">
                          {subject.title}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1.5 line-clamp-2">
                          {subject.description || 'No description provided.'}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>Read notes & chapters</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Shadcn Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground order-2 sm:order-1">
                Showing{' '}
                <span className="font-semibold text-foreground">
                  {startIndex + 1}
                </span>
                –
                <span className="font-semibold text-foreground">
                  {Math.min(startIndex + SUBJECTS_PER_PAGE, filteredSubjects.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-foreground">
                  {filteredSubjects.length}
                </span>{' '}
                subjects
              </p>
              <div className="order-1 sm:order-2">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                      />
                    </PaginationItem>

                    {getPaginationRange(currentPage, totalPages).map((item, idx) => (
                      <PaginationItem key={idx}>
                        {item === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            isActive={currentPage === item}
                            onClick={() => setCurrentPage(item as number)}
                          >
                            {item}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-bold text-foreground">New Subject Category</h3>
            <p className="text-xs text-muted-foreground mb-4 mt-0.5">
              Create a dedicated subject for organizing your learning articles and videos.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Subject Title
                </label>
                <Input
                  placeholder="e.g. System Design, ASP.NET Core 10, Kubernetes"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Description
                </label>
                <Input
                  placeholder="Brief summary of concepts to learn..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Subject'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
