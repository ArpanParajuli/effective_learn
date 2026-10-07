import { apiClient } from './api-client'
import type { Subject, ChapterSummary, ChapterDetail, CreateSubjectPayload, CreateChapterPayload, UpdateChapterPayload } from '@/types'

// Mock baseline data for initial exploration if backend is starting up
const fallbackSubjects: Subject[] = [
  {
    id: 's1',
    title: 'ASP.NET Core 10 Architecture',
    slug: 'aspnet-core-10-architecture',
    description: 'Reference notes, clean architecture patterns, middleware internals, and performance tuning.',
    icon: 'Server',
    displayOrder: 1,
    chapterCount: 2,
    createdAtUtc: new Date().toISOString(),
  },
  {
    id: 's2',
    title: 'System Design & Distributed Systems',
    slug: 'system-design-distributed-systems',
    description: 'Scalability patterns, consensus algorithms, database partitioning, and message queuing.',
    icon: 'Layers',
    displayOrder: 2,
    chapterCount: 1,
    createdAtUtc: new Date().toISOString(),
  },
  {
    id: 's3',
    title: 'PostgreSQL Database Engineering',
    slug: 'postgresql-database-engineering',
    description: 'Deep dive into indexes (B-Tree, BRIN, GIN), query planner execution, and transaction isolation.',
    icon: 'Database',
    displayOrder: 3,
    chapterCount: 1,
    createdAtUtc: new Date().toISOString(),
  },
]

const fallbackChapters: Record<string, ChapterDetail[]> = {
  s1: [
    {
      id: 'c1',
      subjectId: 's1',
      subjectTitle: 'ASP.NET Core 10 Architecture',
      title: '1. Clean Architecture & Project Decomposition',
      slug: 'clean-architecture-and-project-decomposition',
      summary: 'Structuring Domain, Application, Infrastructure, and Presentation layers.',
      orderIndex: 1,
      estimatedMinutes: 8,
      isPublished: true,
      createdAtUtc: new Date().toISOString(),
      content: `# Clean Architecture in Modern .NET 10

Clean Architecture isolates core domain logic from databases, UI presentation, and third-party frameworks.

## Core Rules

1. **Dependency Inversion**: Domain models never reference outer layers.
2. **CQRS with MediatR**: Commands mutate state; Queries retrieve state.
3. **Pipeline Behaviors**: Cross-cutting concerns like validation and logging wrap handler execution.

### Video Lecture
[video:https://www.youtube.com/watch?v=yF9SwL0p0Y0]

### Official Documentation
Check out the architecture guides:
[website:https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/|Microsoft Web Architecture Guide]

\`\`\`csharp
public class GetSubjectsQueryHandler : IRequestHandler<GetSubjectsQuery, List<SubjectDto>>
{
    private readonly IApplicationDbContext _context;
    public GetSubjectsQueryHandler(IApplicationDbContext context) => _context = context;
}
\`\`\`
`,
    },
    {
      id: 'c2',
      subjectId: 's1',
      subjectTitle: 'ASP.NET Core 10 Architecture',
      title: '2. High-Performance Request Pipelines & Middleware',
      slug: 'high-performance-request-pipelines',
      summary: 'Kestrel pipeline execution, Endpoint Routing, and non-allocating memory patterns.',
      orderIndex: 2,
      estimatedMinutes: 6,
      isPublished: true,
      createdAtUtc: new Date().toISOString(),
      content: `# High-Performance Request Pipelines

In ASP.NET Core, incoming HTTP requests flow through a chain of registered middleware delegates before hitting endpoints.

## Middleware Execution Flow
- Global Exception Handler (outermost)
- CORS
- Routing & Endpoint Resolution
- Authentication & Authorization
- Controller / Minimal API execution

### Video Overview
[video:https://www.youtube.com/watch?v=d_k8k04nK_c]

### Related Resources
Read more at [website:https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/|ASP.NET Core Middleware Fundamentals]
`,
    },
  ],
  s2: [
    {
      id: 'c3',
      subjectId: 's2',
      subjectTitle: 'System Design & Distributed Systems',
      title: '1. Database Sharding vs Partitioning',
      slug: 'database-sharding-vs-partitioning',
      summary: 'Horizontal scaling techniques across PostgreSQL nodes and partition keys.',
      orderIndex: 1,
      estimatedMinutes: 7,
      isPublished: true,
      createdAtUtc: new Date().toISOString(),
      content: `# Database Sharding vs Partitioning

When data volume exceeds the capacity of a single relational database instance, horizontal partitioning and sharding become essential.

## Key Differences
- **Partitioning**: Dividing tables into smaller chunks within the same database instance.
- **Sharding**: Distributing partitions across independent physical database servers.

### Video Tutorial
[video:https://www.youtube.com/watch?v=5faMjKuB9bc]
`,
    },
  ],
  s3: [
    {
      id: 'c4',
      subjectId: 's3',
      subjectTitle: 'PostgreSQL Database Engineering',
      title: '1. BRIN Indexes vs B-Tree Indexes',
      slug: 'brin-indexes-vs-btree-indexes',
      summary: 'Block Range Indexes for time-series logs and massive append-only tables.',
      orderIndex: 1,
      estimatedMinutes: 5,
      isPublished: true,
      createdAtUtc: new Date().toISOString(),
      content: `# BRIN Indexes in PostgreSQL

BRIN (Block Range Index) is ideal for massive append-only tables where data is physically sorted.

### Video Resource
[video:https://www.youtube.com/watch?v=M55G6I4N9rM]

### Postgres Documentation
[website:https://www.postgresql.org/docs/current/brin-intro.html|Official PostgreSQL BRIN Documentation]
`,
    },
  ],
}

// Memory cache for client mutations
let localSubjects = [...fallbackSubjects]
let localChapters = { ...fallbackChapters }

export async function fetchSubjects(): Promise<Subject[]> {
  try {
    const res = await apiClient.get<Subject[]>('/subjects')
    if (res.data && res.data.length > 0) return res.data
  } catch {
    // fallback
  }
  return localSubjects
}

export async function createSubject(payload: CreateSubjectPayload): Promise<string> {
  try {
    const res = await apiClient.post<string>('/subjects', payload)
    return res.data
  } catch {
    const newId = `s_${Date.now()}`
    const subject: Subject = {
      id: newId,
      title: payload.title,
      slug: payload.title.toLowerCase().replace(/\s+/g, '-'),
      description: payload.description,
      icon: payload.icon || 'BookOpen',
      displayOrder: payload.displayOrder || localSubjects.length + 1,
      chapterCount: 0,
      createdAtUtc: new Date().toISOString(),
    }
    localSubjects = [...localSubjects, subject]
    localChapters[newId] = []
    return newId
  }
}

export async function fetchChaptersBySubject(subjectId: string): Promise<ChapterSummary[]> {
  try {
    const res = await apiClient.get<ChapterSummary[]>(`/chapters/by-subject/${subjectId}`)
    if (res.data && res.data.length > 0) return res.data
  } catch {
    // fallback
  }
  const chapters = localChapters[subjectId] || []
  return chapters.map((c) => ({
    id: c.id,
    subjectId: c.subjectId,
    title: c.title,
    slug: c.slug,
    summary: c.summary,
    orderIndex: c.orderIndex,
    estimatedMinutes: c.estimatedMinutes,
    isPublished: c.isPublished,
    createdAtUtc: c.createdAtUtc,
  }))
}

export async function fetchChapterById(chapterId: string): Promise<ChapterDetail> {
  try {
    const res = await apiClient.get<ChapterDetail>(`/chapters/${chapterId}`)
    if (res.data) return res.data
  } catch {
    // fallback
  }

  for (const subjectId in localChapters) {
    const found = localChapters[subjectId]?.find((c) => c.id === chapterId)
    if (found) return found
  }
  throw new Error('Chapter not found')
}

export async function createChapter(payload: CreateChapterPayload): Promise<string> {
  try {
    const res = await apiClient.post<string>('/chapters', payload)
    return res.data
  } catch {
    const newId = `c_${Date.now()}`
    const subject = localSubjects.find((s) => s.id === payload.subjectId)
    const chapter: ChapterDetail = {
      id: newId,
      subjectId: payload.subjectId,
      subjectTitle: subject?.title || 'General',
      title: payload.title,
      slug: payload.title.toLowerCase().replace(/\s+/g, '-'),
      summary: payload.summary,
      content: payload.content,
      orderIndex: payload.orderIndex || 1,
      estimatedMinutes: payload.estimatedMinutes || 5,
      isPublished: payload.isPublished ?? true,
      createdAtUtc: new Date().toISOString(),
    }
    if (!localChapters[payload.subjectId]) {
      localChapters[payload.subjectId] = []
    }
    localChapters[payload.subjectId].push(chapter)
    if (subject) subject.chapterCount++
    return newId
  }
}

export async function updateChapter(payload: UpdateChapterPayload): Promise<void> {
  try {
    await apiClient.put(`/chapters/${payload.id}`, payload)
  } catch {
    for (const subjectId in localChapters) {
      const idx = localChapters[subjectId]?.findIndex((c) => c.id === payload.id)
      if (idx !== undefined && idx >= 0) {
        const existing = localChapters[subjectId][idx]
        localChapters[subjectId][idx] = {
          ...existing,
          title: payload.title,
          summary: payload.summary,
          content: payload.content,
          orderIndex: payload.orderIndex,
          estimatedMinutes: payload.estimatedMinutes,
          isPublished: payload.isPublished,
          updatedAtUtc: new Date().toISOString(),
        }
        break
      }
    }
  }
}
