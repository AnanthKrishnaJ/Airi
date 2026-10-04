import {
  TopicInfo,
  Question,
  ExamAttempt,
  ExamResult,
  UserStats,
  AdminStats,
  BookmarkItem,
  QuizSettings,
  DifficultyLevel
} from '../types/quiz';

export async function fetchTopics(category?: string): Promise<{ topics: TopicInfo[]; total: number }> {
  const url = category ? `/api/topics?category=${category}` : '/api/topics';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch topics');
  return res.json();
}

export async function fetchQuestions(params: {
  topicId?: string;
  category?: string;
  difficulty?: string;
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: Question[]; total: number }> {
  const query = new URLSearchParams();
  if (params.topicId) query.set('topicId', params.topicId);
  if (params.category) query.set('category', params.category);
  if (params.difficulty) query.set('difficulty', params.difficulty);
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));

  const res = await fetch(`/api/questions?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function startQuiz(params: {
  title?: string;
  mode?: 'practice' | 'exam';
  category?: string;
  topicId?: string;
  difficulty?: DifficultyLevel | 'mixed';
  count: number;
  durationMinutes: number;
}): Promise<ExamAttempt> {
  const res = await fetch('/api/quiz/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed to initiate quiz');
  return res.json();
}

export async function fetchAttempt(attemptId: string): Promise<ExamAttempt> {
  const res = await fetch(`/api/attempts/${attemptId}`);
  if (!res.ok) throw new Error('Failed to load quiz attempt');
  return res.json();
}

export async function saveAttemptAnswer(
  attemptId: string,
  payload: {
    questionId: string;
    selectedOption: number | null;
    isMarkedForReview?: boolean;
    visited?: boolean;
    timeSpentSeconds?: number;
  }
) {
  const res = await fetch(`/api/attempts/${attemptId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to save answer');
  return res.json();
}

export async function recordViolation(attemptId: string): Promise<number> {
  try {
    const res = await fetch(`/api/attempts/${attemptId}/violation`, {
      method: 'POST'
    });
    const data = await res.json();
    return data.violationsCount || 0;
  } catch {
    return 0;
  }
}

export async function submitQuizAttempt(attemptId: string): Promise<ExamResult> {
  const res = await fetch(`/api/attempts/${attemptId}/submit`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to submit test');
  return res.json();
}

export async function fetchResult(attemptId: string): Promise<ExamResult> {
  const res = await fetch(`/api/results/${attemptId}`);
  if (!res.ok) throw new Error('Failed to load results');
  return res.json();
}

export async function fetchBookmarks(topicId?: string): Promise<{ bookmarks: BookmarkItem[]; total: number }> {
  const url = topicId ? `/api/bookmarks?topicId=${topicId}` : '/api/bookmarks';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load bookmarks');
  return res.json();
}

export async function toggleBookmark(questionId: string): Promise<{ bookmarked: boolean }> {
  const res = await fetch('/api/bookmarks/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId })
  });
  if (!res.ok) throw new Error('Failed to toggle bookmark');
  return res.json();
}

export async function fetchUserStats(): Promise<UserStats> {
  const res = await fetch('/api/stats/user');
  if (!res.ok) throw new Error('Failed to load user stats');
  return res.json();
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch('/api/stats/admin');
  if (!res.ok) throw new Error('Failed to load admin stats');
  return res.json();
}

export async function fetchSettings(): Promise<QuizSettings> {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to load settings');
  return res.json();
}

export async function updateSettings(settings: Partial<QuizSettings>): Promise<QuizSettings> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function generateQuestions(payload: {
  topicId: string;
  difficulty: DifficultyLevel;
  count: number;
  useAi: boolean;
}) {
  const res = await fetch('/api/questions/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to generate questions');
  return res.json();
}

export async function fetchPendingQuestions(): Promise<{ items: Question[]; total: number }> {
  const res = await fetch('/api/questions/pending');
  if (!res.ok) throw new Error('Failed to fetch pending questions');
  return res.json();
}

export async function approveQuestion(id: string) {
  const res = await fetch(`/api/questions/pending/${id}/approve`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve question');
  return res.json();
}

export async function rejectQuestion(id: string) {
  const res = await fetch(`/api/questions/pending/${id}/reject`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reject question');
  return res.json();
}

export async function addCustomQuestion(questionData: any): Promise<Question> {
  const res = await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questionData)
  });
  if (!res.ok) throw new Error('Failed to add question');
  return res.json();
}

export async function deleteQuestion(id: string) {
  const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete question');
  return res.json();
}

export async function importQuestions(format: 'json' | 'csv', data: any) {
  const res = await fetch('/api/questions/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format, data })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to import questions');
  }
  return res.json();
}
