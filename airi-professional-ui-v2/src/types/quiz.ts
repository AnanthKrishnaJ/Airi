export type CategoryType = 'quantitative' | 'logical' | 'verbal';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface TopicInfo {
  id: string;
  name: string;
  category: CategoryType;
  description: string;
  subtopics: string[];
  formulaHints?: string[];
  totalQuestionsCount?: number;
}

export interface Question {
  id: string;
  topicId: string;
  topicName: string;
  category: CategoryType;
  subtopic: string;
  difficulty: DifficultyLevel;
  questionText: string;
  options: [string, string, string, string]; // Exactly 4 options
  correctOption: number; // 0, 1, 2, or 3
  explanation: string; // Step-by-step mathematical / logical explanation
  tags: string[];
  source?: string;
  status: 'active' | 'pending_review';
  createdAt: string;
  updatedAt: string;
}

// Sanitized question sent to student during exam (correct answer and explanation are hidden)
export interface ClientExamQuestion {
  id: string;
  topicId: string;
  topicName: string;
  category: CategoryType;
  subtopic: string;
  difficulty: DifficultyLevel;
  questionText: string;
  options: [string, string, string, string];
  tags: string[];
}

export type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked_for_review' | 'answered_marked_for_review';

export interface UserAnswerState {
  questionId: string;
  selectedOption: number | null; // 0, 1, 2, 3 or null if unattempted
  isMarkedForReview: boolean;
  timeSpentSeconds: number;
  visited: boolean;
}

export interface ExamAttempt {
  id: string;
  title: string;
  mode: 'practice' | 'exam';
  category?: CategoryType | 'full';
  topicId?: string;
  topicName?: string;
  difficulty?: DifficultyLevel | 'mixed';
  totalQuestions: number;
  durationMinutes: number;
  startTime: number;
  endTime?: number;
  remainingSeconds: number;
  isSubmitted: boolean;
  questions: ClientExamQuestion[];
  answers: Record<string, UserAnswerState>;
  violationsCount: number;
  markingScheme: {
    correct: number;
    wrong: number;
    unattempted: number;
  };
}

export interface QuestionReviewItem {
  id: string;
  topicId: string;
  topicName: string;
  category: CategoryType;
  difficulty: DifficultyLevel;
  questionText: string;
  options: [string, string, string, string];
  selectedOption: number | null;
  correctOption: number;
  isCorrect: boolean;
  isAttempted: boolean;
  marksAwarded: number;
  explanation: string;
  timeSpentSeconds: number;
  isMarkedForReview: boolean;
  isBookmarked?: boolean;
}

export interface TopicResultBreakdown {
  topicId: string;
  topicName: string;
  category: CategoryType;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  unattempted: number;
  marks: number;
  maxMarks: number;
  accuracy: number; // percentage
}

export interface DifficultyResultBreakdown {
  difficulty: DifficultyLevel;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

export interface CategoryResultBreakdown {
  category: CategoryType;
  categoryName: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  marks: number;
  accuracy: number;
}

export interface ExamResult {
  id: string;
  attemptId: string;
  title: string;
  mode: 'practice' | 'exam';
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  positiveMarks: number;
  negativeMarks: number;
  netScore: number;
  maxPossibleScore: number;
  percentage: number;
  accuracy: number;
  timeTakenSeconds: number;
  totalTimeSeconds: number;
  violationsCount: number;
  submittedAt: string;
  markingScheme: {
    correct: number;
    wrong: number;
    unattempted: number;
  };
  categoryBreakdown: CategoryResultBreakdown[];
  topicBreakdown: TopicResultBreakdown[];
  difficultyBreakdown: DifficultyResultBreakdown[];
  questionsReview: QuestionReviewItem[];
}

export interface TopicProgress {
  topicId: string;
  topicName: string;
  category: CategoryType;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
  questionsBankCount: number;
}

export interface DifficultyProgress {
  difficulty: DifficultyLevel;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

export interface UserStats {
  totalTestsCompleted: number;
  totalQuestionsAttempted: number;
  totalCorrect: number;
  totalWrong: number;
  averageScore: number;
  bestScore: number;
  averageAccuracy: number;
  totalTimeSpentMinutes: number;
  categoryProgress: {
    quantitative: { attempted: number; correct: number; accuracy: number; questionsBankCount: number };
    logical: { attempted: number; correct: number; accuracy: number; questionsBankCount: number };
    verbal: { attempted: number; correct: number; accuracy: number; questionsBankCount: number };
  };
  difficultyProgress: Record<DifficultyLevel, DifficultyProgress>;
  topicProgress: TopicProgress[];
  weakTopics: { topicName: string; accuracy: number; attempts: number }[];
  strongTopics: { topicName: string; accuracy: number; attempts: number }[];
  recentAttempts: {
    id: string;
    title: string;
    score: number;
    maxScore: number;
    accuracy: number;
    date: string;
  }[];
}

export interface AdminStats {
  totalQuestions: number;
  totalActiveQuestions: number;
  totalPendingQuestions: number;
  totalAttempts: number;
  averageScore: number;
  averageAccuracy: number;
  questionsPerCategory: Record<CategoryType, number>;
  questionsPerDifficulty: Record<DifficultyLevel, number>;
  topPracticedTopics: { topicName: string; attemptsCount: number }[];
}

export interface BookmarkItem {
  id: string;
  questionId: string;
  questionText: string;
  topicId: string;
  topicName: string;
  category: CategoryType;
  difficulty: DifficultyLevel;
  options: [string, string, string, string];
  correctOption: number;
  explanation: string;
  savedAt: string;
}

export interface QuizSettings {
  markingCorrect: number;
  markingWrong: number; // e.g. -1 or -0.25
  markingUnattempted: number; // 0
  masterTestDurationMinutes: number;
  masterTestQuestionsCount: number;
  masterTestDistribution: {
    quantitative: number;
    logical: number;
    verbal: number;
  };
  antiCheatingEnabled: boolean;
}
