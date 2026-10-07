import * as React from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Layers, Play, Clock, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

export function DecksPage() {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedTag, setSelectedTag] = React.useState<string>('All')
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState('')
  const [newDescription, setNewDescription] = React.useState('')
  const [newTag, setNewTag] = React.useState('General')

  const [decks, setDecks] = React.useState([
    {
      id: '1',
      title: 'ASP.NET Core 10 Internals & GC',
      description: 'Memory models, non-allocating patterns, middleware pipeline, and Kestrel tuning.',
      dueCards: 12,
      totalCards: 85,
      mastery: 78,
      tag: 'Backend',
    },
    {
      id: '2',
      title: 'PostgreSQL Indexing & Optimization',
      description: 'B-Tree, GIN, BRIN indexes, EXPLAIN ANALYZE interpretation, and vacuum tuning.',
      dueCards: 8,
      totalCards: 64,
      mastery: 84,
      tag: 'Database',
    },
    {
      id: '3',
      title: 'Distributed Systems & Consensus',
      description: 'Raft, Paxos, 2PC, event-driven saga pattern, idempotency keys, and CAP trade-offs.',
      dueCards: 4,
      totalCards: 52,
      mastery: 65,
      tag: 'Architecture',
    },
    {
      id: '4',
      title: 'Modern TypeScript & Type-Level Programming',
      description: 'Conditional types, infer keyword, template literal types, and mapped types.',
      dueCards: 15,
      totalCards: 45,
      mastery: 92,
      tag: 'Frontend',
    },
    {
      id: '5',
      title: 'Docker & Kubernetes Fundamentals',
      description: 'Multi-stage builds, non-root users, namespaces, cgroups, and pod lifecycle.',
      dueCards: 6,
      totalCards: 38,
      mastery: 70,
      tag: 'DevOps',
    },
  ])

  const tags = ['All', 'Backend', 'Database', 'Architecture', 'Frontend', 'DevOps']

  const filteredDecks = decks.filter((deck) => {
    const matchesSearch =
      deck.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = selectedTag === 'All' || deck.tag === selectedTag
    return matchesSearch && matchesTag
  })

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      toast.error('Deck title is required')
      return
    }

    const newDeck = {
      id: String(Date.now()),
      title: newTitle,
      description: newDescription || 'No description provided.',
      dueCards: 0,
      totalCards: 0,
      mastery: 0,
      tag: newTag,
    }

    setDecks([newDeck, ...decks])
    setNewTitle('')
    setNewDescription('')
    setShowCreateModal(false)
    toast.success('Study Deck created successfully!')
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Study Decks</h1>
          <p className="text-sm text-slate-400">Organize your subjects and track topic retention</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="sm:self-start">
          <Plus className="h-4 w-4" />
          Create Deck
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search decks by keyword or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Decks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDecks.map((deck) => (
          <Card key={deck.id} className="flex flex-col justify-between group">
            <div>
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{deck.tag}</Badge>
                  {deck.dueCards > 0 ? (
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {deck.dueCards} Due
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-400">Up to date</span>
                  )}
                </div>
                <CardTitle className="text-lg group-hover:text-indigo-400 transition-colors">
                  {deck.title}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {deck.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Mastery Level</span>
                    <span className="text-slate-200 font-semibold">{deck.mastery}%</span>
                  </div>
                  <Progress value={deck.mastery} className="h-1.5" />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-slate-500" />
                    {deck.totalCards} Flashcards
                  </span>
                </div>
              </CardContent>
            </div>
            <div className="p-6 pt-0 flex gap-2">
              <Link to="/study" className="flex-1">
                <Button className="w-full text-xs font-medium" variant={deck.dueCards > 0 ? 'default' : 'secondary'}>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Study Now
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Deck Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              Create Study Deck
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a new collection of flashcards for active recall and spaced repetition.
            </p>
            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Deck Title</label>
                <Input
                  placeholder="e.g. Clean Architecture in .NET 10"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <Input
                  placeholder="Brief summary of concepts covered..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category / Tag</label>
                <Input
                  placeholder="e.g. Backend, Algorithms, System Design"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Deck</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
