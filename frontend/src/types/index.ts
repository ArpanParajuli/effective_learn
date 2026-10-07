export interface Subject {
  id: string
  title: string
  slug: string
  description: string
  icon: string
  displayOrder: number
  chapterCount: number
  createdAtUtc: string
}

export interface ChapterSummary {
  id: string
  subjectId: string
  title: string
  slug: string
  summary: string
  orderIndex: number
  estimatedMinutes: number
  isPublished: boolean
  createdAtUtc: string
}

export interface ChapterDetail {
  id: string
  subjectId: string
  subjectTitle: string
  title: string
  slug: string
  summary: string
  content: string
  orderIndex: number
  estimatedMinutes: number
  isPublished: boolean
  createdAtUtc: string
  updatedAtUtc?: string
}

export interface CreateSubjectPayload {
  title: string
  description: string
  icon?: string
  displayOrder?: number
}

export interface CreateChapterPayload {
  subjectId: string
  title: string
  summary: string
  content: string
  orderIndex?: number
  estimatedMinutes?: number
  isPublished?: boolean
}

export interface UpdateChapterPayload {
  id: string
  title: string
  summary: string
  content: string
  orderIndex: number
  estimatedMinutes: number
  isPublished: boolean
}
