export interface Deck {
  id: string
  title: string
  description: string
  totalCards: number
  dueCards: number
  masteryPercentage: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Flashcard {
  id: string
  deckId: string
  frontContent: string
  backContent: string
  hint?: string
  easeFactor: number
  repetitions: number
  intervalDays: number
  nextReviewDate: string
  status: 'New' | 'Learning' | 'Review' | 'Mastered'
}

export type ReviewRating = 1 | 2 | 3 | 4 | 5 // 1: Again, 2: Hard, 3: Good, 4: Easy, 5: Perfect

export interface StudySessionResult {
  cardId: string
  rating: ReviewRating
  responseTimeMs: number
}

export interface LearningStats {
  totalReviewedToday: number
  currentStreakDays: number
  retentionRate: number
  totalMasteredCards: number
}
