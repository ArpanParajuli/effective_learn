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
import { toast } from 'sonner'

export function SubjectsPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState('')
  const [newDescription, setNewDescription] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Knowledge Subjects
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
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
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
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
            <Card key={i} className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
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
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <BookOpen className="h-8 w-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No subjects yet</p>
          <p className="text-xs text-slate-500 mt-1">Create your first subject to start writing chapters.</p>
          <Button onClick={() => setShowModal(true)} size="sm" className="mt-4">
            Create Subject
          </Button>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center space-y-3">
          <Search className="h-7 w-7 mx-auto text-slate-400" />
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            No subjects matching "{searchQuery}"
          </p>
          <p className="text-xs text-slate-500">
            Try adjusting your query or clear the search to view all subjects.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSubjects.map((subject) => {
            const Icon = getSubjectIcon(subject.icon)

            return (
              <Link
                key={subject.id}
                to={`/subjects/${subject.id}`}
                className="group block"
              >
                <Card className="h-full flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-all bg-white dark:bg-[#11131a]">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge variant="outline">
                        {subject.chapterCount} {subject.chapterCount === 1 ? 'Chapter' : 'Chapters'}
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {subject.title}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1.5 line-clamp-2">
                        {subject.description || 'No description provided.'}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span>Read notes & chapters</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Create Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Subject Category</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 mt-0.5">
              Create a dedicated subject for organizing your learning articles and videos.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
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
