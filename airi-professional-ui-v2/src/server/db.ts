import fs from 'fs';
import path from 'path';
import {
  Question,
  DifficultyLevel,
  ExamAttempt,
  ExamResult,
  BookmarkItem,
  QuizSettings,
  ClientExamQuestion,
  UserAnswerState
} from '../types/quiz';
import { ALL_TOPICS, TOPIC_BY_ID } from '../data/topics';
import { generateQuestionForTopic } from './generators/procedural-generator';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'aptimaster-db.json');

export interface DatabaseSchema {
  questions: Record<string, Question>;
  attempts: Record<string, ExamAttempt>;
  results: Record<string, ExamResult>;
  bookmarks: Record<string, BookmarkItem>;
  settings: QuizSettings;
}

const DEFAULT_SETTINGS: QuizSettings = {
  markingCorrect: 1,
  markingWrong: -1, // Negative marking -1 as explicitly requested
  markingUnattempted: 0,
  masterTestDurationMinutes: 100,
  masterTestQuestionsCount: 100,
  masterTestDistribution: {
    quantitative: 40,
    logical: 35,
    verbal: 25
  },
  antiCheatingEnabled: true
};

class AptitudeDatabase {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = {
      questions: {},
      attempts: {},
      results: {},
      bookmarks: {},
      settings: { ...DEFAULT_SETTINGS }
    };
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.data,
          ...parsed,
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) }
        };
        console.log(`Loaded ${Object.keys(this.data.questions).length} questions from database.`);
      } catch (err) {
        console.error('Failed to parse database file, reinitializing:', err);
      }
    }

    // Seed questions if question bank is below threshold (seed at least 15-20 questions per topic initially)
    this.seedInitialQuestions();
  }

  private seedInitialQuestions() {
    let newCount = 0;
    const difficulties: DifficultyLevel[] = ['Easy', 'Medium', 'Hard', 'Expert'];

    for (const topic of ALL_TOPICS) {
      // Check existing questions for this topic
      const existing = Object.values(this.data.questions).filter(q => q.topicId === topic.id);
      if (existing.length < 16) {
        const toGenerate = 16 - existing.length;
        for (let i = 0; i < toGenerate; i++) {
          const diff = difficulties[i % difficulties.length];
          const q = generateQuestionForTopic(topic.id, diff, i);
          if (q) {
            this.data.questions[q.id] = q;
            newCount++;
          }
        }
      }
    }

    if (newCount > 0) {
      console.log(`Seeded ${newCount} questions across 62 aptitude topics.`);
      this.persist();
    }
  }

  private persist() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (err) {
        console.error('Error persisting database:', err);
      }
    }, 300);
  }

  // ================= QUESTIONS =================
  public getQuestions(filter?: {
    topicId?: string;
    category?: string;
    difficulty?: string;
    status?: 'active' | 'pending_review';
    search?: string;
    limit?: number;
    offset?: number;
  }): { items: Question[]; total: number } {
    let all = Object.values(this.data.questions);

    if (filter?.status) {
      all = all.filter(q => q.status === filter.status);
    } else {
      // Default to active questions unless pending requested
      all = all.filter(q => q.status === 'active');
    }

    if (filter?.topicId) {
      all = all.filter(q => q.topicId === filter.topicId);
    }

    if (filter?.category) {
      all = all.filter(q => q.category === filter.category);
    }

    if (filter?.difficulty) {
      all = all.filter(q => q.difficulty.toLowerCase() === filter.difficulty!.toLowerCase());
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      all = all.filter(
        item =>
          item.questionText.toLowerCase().includes(q) ||
          item.topicName.toLowerCase().includes(q) ||
          item.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    const total = all.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 50;
    const items = all.slice(offset, offset + limit);

    return { items, total };
  }

  public getQuestionById(id: string): Question | undefined {
    return this.data.questions[id];
  }

  public addQuestion(question: Question): Question {
    this.data.questions[question.id] = question;
    this.persist();
    return question;
  }

  public addQuestionsBatch(questions: Question[]): number {
    let count = 0;
    for (const q of questions) {
      if (!this.data.questions[q.id]) {
        this.data.questions[q.id] = q;
        count++;
      }
    }
    this.persist();
    return count;
  }

  public updateQuestion(id: string, updates: Partial<Question>): Question | null {
    const existing = this.data.questions[id];
    if (!existing) return null;
    const updated: Question = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.questions[id] = updated;
    this.persist();
    return updated;
  }

  public deleteQuestion(id: string): boolean {
    if (this.data.questions[id]) {
      delete this.data.questions[id];
      this.persist();
      return true;
    }
    return false;
  }

  public approveQuestion(id: string): Question | null {
    const q = this.data.questions[id];
    if (!q) return null;
    q.status = 'active';
    q.updatedAt = new Date().toISOString();
    this.persist();
    return q;
  }

  public rejectQuestion(id: string): boolean {
    return this.deleteQuestion(id);
  }

  // Ensure sufficient questions for a test; automatically generate non-duplicate questions if needed
  public ensureQuestionsForTopic(topicId: string, count: number, difficulty?: DifficultyLevel): Question[] {
    let pool = Object.values(this.data.questions).filter(q => q.topicId === topicId && q.status === 'active');
    if (difficulty && difficulty !== ('mixed' as any)) {
      pool = pool.filter(q => q.difficulty === difficulty);
    }

    if (pool.length < count) {
      const needed = count - pool.length + 5;
      const difficulties: DifficultyLevel[] = difficulty && difficulty !== ('mixed' as any)
        ? [difficulty]
        : ['Easy', 'Medium', 'Hard', 'Expert'];

      for (let i = 0; i < needed; i++) {
        const diff = difficulties[i % difficulties.length];
        const newQ = generateQuestionForTopic(topicId, diff, i + pool.length);
        if (newQ) {
          this.data.questions[newQ.id] = newQ;
          pool.push(newQ);
        }
      }
      this.persist();
    }

    // Shuffle pool
    return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  }

  // ================= QUIZ ATTEMPTS =================
  public createAttempt(params: {
    title: string;
    mode: 'practice' | 'exam';
    category?: 'quantitative' | 'logical' | 'verbal' | 'full';
    topicId?: string;
    difficulty?: DifficultyLevel | 'mixed';
    count: number;
    durationMinutes: number;
  }): { attempt: ExamAttempt; questions: ClientExamQuestion[] } {
    const attemptId = `att-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    const settings = this.getSettings();

    let selectedQuestions: Question[] = [];

    const targetDifficulty: DifficultyLevel | undefined =
      params.difficulty && params.difficulty !== 'mixed' ? params.difficulty : undefined;

    if (params.topicId) {
      selectedQuestions = this.ensureQuestionsForTopic(params.topicId, params.count, targetDifficulty);
    } else {
      // Full Aptitude Master Test or Category Test
      if (params.category && params.category !== 'full') {
        // Specific category
        const catTopics = ALL_TOPICS.filter(t => t.category === params.category);
        const perTopic = Math.max(1, Math.ceil(params.count / catTopics.length));
        for (const topic of catTopics) {
          const qs = this.ensureQuestionsForTopic(topic.id, perTopic, targetDifficulty);
          selectedQuestions.push(...qs);
          if (selectedQuestions.length >= params.count) break;
        }
      } else {
        // FULL MASTER TEST: Default distribution 40 Quant, 35 Logical, 25 Verbal
        const dist = settings.masterTestDistribution;
        const totalReq = params.count;
        const ratioQuant = dist.quantitative / (dist.quantitative + dist.logical + dist.verbal);
        const ratioLogical = dist.logical / (dist.quantitative + dist.logical + dist.verbal);

        const countQuant = Math.round(totalReq * ratioQuant);
        const countLogical = Math.round(totalReq * ratioLogical);
        const countVerbal = totalReq - countQuant - countLogical;

        const quantTopics = ALL_TOPICS.filter(t => t.category === 'quantitative');
        const logicalTopics = ALL_TOPICS.filter(t => t.category === 'logical');
        const verbalTopics = ALL_TOPICS.filter(t => t.category === 'verbal');

        // Pick from quant
        let qIndex = 0;
        while (selectedQuestions.filter(q => q.category === 'quantitative').length < countQuant) {
          const topic = quantTopics[qIndex % quantTopics.length];
          const qs = this.ensureQuestionsForTopic(topic.id, 2);
          for (const q of qs) {
            if (!selectedQuestions.some(existing => existing.id === q.id)) {
              selectedQuestions.push(q);
              if (selectedQuestions.filter(x => x.category === 'quantitative').length >= countQuant) break;
            }
          }
          qIndex++;
        }

        // Pick from logical
        let lIndex = 0;
        while (selectedQuestions.filter(q => q.category === 'logical').length < countLogical) {
          const topic = logicalTopics[lIndex % logicalTopics.length];
          const qs = this.ensureQuestionsForTopic(topic.id, 2);
          for (const q of qs) {
            if (!selectedQuestions.some(existing => existing.id === q.id)) {
              selectedQuestions.push(q);
              if (selectedQuestions.filter(x => x.category === 'logical').length >= countLogical) break;
            }
          }
          lIndex++;
        }

        // Pick from verbal
        let vIndex = 0;
        while (selectedQuestions.filter(q => q.category === 'verbal').length < countVerbal) {
          const topic = verbalTopics[vIndex % verbalTopics.length];
          const qs = this.ensureQuestionsForTopic(topic.id, 2);
          for (const q of qs) {
            if (!selectedQuestions.some(existing => existing.id === q.id)) {
              selectedQuestions.push(q);
              if (selectedQuestions.filter(x => x.category === 'verbal').length >= countVerbal) break;
            }
          }
          vIndex++;
        }
      }
    }

    // Limit to requested count & shuffle question order
    selectedQuestions = selectedQuestions.slice(0, params.count).sort(() => Math.random() - 0.5);

    // Prepare sanitized client questions (NEVER send correctOption or explanation to browser during exam!)
    const clientQuestions: ClientExamQuestion[] = selectedQuestions.map(q => ({
      id: q.id,
      topicId: q.topicId,
      topicName: q.topicName,
      category: q.category,
      subtopic: q.subtopic,
      difficulty: q.difficulty,
      questionText: q.questionText,
      options: q.options,
      tags: q.tags
    }));

    const answersRecord: Record<string, UserAnswerState> = {};
    for (const q of selectedQuestions) {
      answersRecord[q.id] = {
        questionId: q.id,
        selectedOption: null,
        isMarkedForReview: false,
        timeSpentSeconds: 0,
        visited: false
      };
    }

    const attempt: ExamAttempt = {
      id: attemptId,
      title: params.title,
      mode: params.mode,
      category: params.category,
      topicId: params.topicId,
      topicName: params.topicId ? TOPIC_BY_ID.get(params.topicId)?.name : undefined,
      difficulty: params.difficulty,
      totalQuestions: clientQuestions.length,
      durationMinutes: params.durationMinutes,
      startTime: now,
      remainingSeconds: params.durationMinutes * 60,
      isSubmitted: false,
      questions: clientQuestions,
      answers: answersRecord,
      violationsCount: 0,
      markingScheme: {
        correct: settings.markingCorrect,
        wrong: settings.markingWrong,
        unattempted: settings.markingUnattempted
      }
    };

    this.data.attempts[attemptId] = attempt;
    this.persist();

    return { attempt, questions: clientQuestions };
  }

  public getAttempt(id: string): ExamAttempt | undefined {
    return this.data.attempts[id];
  }

  public recordViolation(attemptId: string): number {
    const attempt = this.data.attempts[attemptId];
    if (!attempt) return 0;
    attempt.violationsCount = (attempt.violationsCount || 0) + 1;
    this.persist();
    return attempt.violationsCount;
  }

  public saveAnswer(
    attemptId: string,
    questionId: string,
    payload: {
      selectedOption: number | null;
      isMarkedForReview?: boolean;
      visited?: boolean;
      timeSpentSeconds?: number;
    }
  ): UserAnswerState | null {
    const attempt = this.data.attempts[attemptId];
    if (!attempt || attempt.isSubmitted) return null;

    if (!attempt.answers[questionId]) {
      attempt.answers[questionId] = {
        questionId,
        selectedOption: payload.selectedOption,
        isMarkedForReview: !!payload.isMarkedForReview,
        timeSpentSeconds: payload.timeSpentSeconds || 0,
        visited: payload.visited ?? true
      };
    } else {
      const cur = attempt.answers[questionId];
      cur.selectedOption = payload.selectedOption !== undefined ? payload.selectedOption : cur.selectedOption;
      if (payload.isMarkedForReview !== undefined) cur.isMarkedForReview = payload.isMarkedForReview;
      if (payload.visited !== undefined) cur.visited = payload.visited;
      if (payload.timeSpentSeconds !== undefined) cur.timeSpentSeconds = payload.timeSpentSeconds;
    }

    this.persist();
    return attempt.answers[questionId];
  }

  // ================= SCORING ENGINE =================
  public submitAttempt(attemptId: string): ExamResult | null {
    const attempt = this.data.attempts[attemptId];
    if (!attempt) return null;

    if (attempt.isSubmitted && this.data.results[attemptId]) {
      return this.data.results[attemptId];
    }

    const now = Date.now();
    attempt.isSubmitted = true;
    attempt.endTime = now;

    const timeTakenSeconds = Math.max(1, Math.round((now - attempt.startTime) / 1000));
    const scheme = attempt.markingScheme || {
      correct: this.data.settings.markingCorrect,
      wrong: this.data.settings.markingWrong,
      unattempted: this.data.settings.markingUnattempted
    };

    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;
    let positiveMarks = 0;
    let negativeMarks = 0; // Absolute value of deducted marks

    const questionsReview = [];
    const topicMap = new Map<string, {
      topicId: string;
      topicName: string;
      category: any;
      total: number;
      attempted: number;
      correct: number;
      wrong: number;
      unattempted: number;
      marks: number;
    }>();

    const diffMap = new Map<DifficultyLevel, { total: number; attempted: number; correct: number; wrong: number }>();
    (['Easy', 'Medium', 'Hard', 'Expert'] as DifficultyLevel[]).forEach(d => {
      diffMap.set(d, { total: 0, attempted: 0, correct: 0, wrong: 0 });
    });

    const catMap = new Map<string, { total: number; attempted: number; correct: number; wrong: number; marks: number }>();
    (['quantitative', 'logical', 'verbal'] as const).forEach(c => {
      catMap.set(c, { total: 0, attempted: 0, correct: 0, wrong: 0, marks: 0 });
    });

    for (const clientQ of attempt.questions) {
      const fullQ = this.data.questions[clientQ.id];
      const answerState = attempt.answers[clientQ.id];
      const selected = answerState?.selectedOption ?? null;
      const isAttempted = selected !== null && selected !== undefined;
      const correctOpt = fullQ ? fullQ.correctOption : 0;
      const isCorrect = isAttempted && selected === correctOpt;

      let marksAwarded = 0;
      if (isAttempted) {
        if (isCorrect) {
          correctCount++;
          marksAwarded = scheme.correct;
          positiveMarks += scheme.correct;
        } else {
          wrongCount++;
          marksAwarded = scheme.wrong;
          negativeMarks += Math.abs(scheme.wrong);
        }
      } else {
        unattemptedCount++;
        marksAwarded = scheme.unattempted;
      }

      // Track by topic
      const tid = clientQ.topicId;
      if (!topicMap.has(tid)) {
        topicMap.set(tid, {
          topicId: tid,
          topicName: clientQ.topicName,
          category: clientQ.category,
          total: 0,
          attempted: 0,
          correct: 0,
          wrong: 0,
          unattempted: 0,
          marks: 0
        });
      }
      const tStat = topicMap.get(tid)!;
      tStat.total++;
      if (isAttempted) {
        tStat.attempted++;
        if (isCorrect) tStat.correct++;
        else tStat.wrong++;
      } else {
        tStat.unattempted++;
      }
      tStat.marks += marksAwarded;

      // Track by difficulty
      const dStat = diffMap.get(clientQ.difficulty) || { total: 0, attempted: 0, correct: 0, wrong: 0 };
      dStat.total++;
      if (isAttempted) {
        dStat.attempted++;
        if (isCorrect) dStat.correct++;
        else dStat.wrong++;
      }
      diffMap.set(clientQ.difficulty, dStat);

      // Track by category
      const cStat = catMap.get(clientQ.category) || { total: 0, attempted: 0, correct: 0, wrong: 0, marks: 0 };
      cStat.total++;
      if (isAttempted) {
        cStat.attempted++;
        if (isCorrect) cStat.correct++;
        else cStat.wrong++;
      }
      cStat.marks += marksAwarded;
      catMap.set(clientQ.category, cStat);

      const isBookmarked = !!this.data.bookmarks[clientQ.id];

      questionsReview.push({
        id: clientQ.id,
        topicId: clientQ.topicId,
        topicName: clientQ.topicName,
        category: clientQ.category,
        difficulty: clientQ.difficulty,
        questionText: clientQ.questionText,
        options: clientQ.options,
        selectedOption: selected,
        correctOption: correctOpt,
        isCorrect,
        isAttempted,
        marksAwarded,
        explanation: fullQ?.explanation || 'Detailed step-by-step logic provided.',
        timeSpentSeconds: answerState?.timeSpentSeconds || 0,
        isMarkedForReview: !!answerState?.isMarkedForReview,
        isBookmarked
      });
    }

    const netScore = positiveMarks - negativeMarks;
    const maxPossibleScore = attempt.questions.length * scheme.correct;
    const attemptedCount = correctCount + wrongCount;
    const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;
    const percentage = maxPossibleScore > 0 ? Math.max(0, (netScore / maxPossibleScore) * 100) : 0;

    const topicBreakdown = Array.from(topicMap.values()).map(t => ({
      topicId: t.topicId,
      topicName: t.topicName,
      category: t.category,
      totalQuestions: t.total,
      attempted: t.attempted,
      correct: t.correct,
      wrong: t.wrong,
      unattempted: t.unattempted,
      marks: t.marks,
      maxMarks: t.total * scheme.correct,
      accuracy: t.attempted > 0 ? (t.correct / t.attempted) * 100 : 0
    }));

    const difficultyBreakdown = Array.from(diffMap.entries()).map(([diff, d]) => ({
      difficulty: diff,
      totalQuestions: d.total,
      attempted: d.attempted,
      correct: d.correct,
      wrong: d.wrong,
      accuracy: d.attempted > 0 ? (d.correct / d.attempted) * 100 : 0
    }));

    const categoryNames: Record<string, string> = {
      quantitative: 'Quantitative Aptitude',
      logical: 'Logical Reasoning',
      verbal: 'Verbal Ability'
    };

    const categoryBreakdown = Array.from(catMap.entries()).map(([cat, c]) => ({
      category: cat as any,
      categoryName: categoryNames[cat] || cat,
      totalQuestions: c.total,
      attempted: c.attempted,
      correct: c.correct,
      wrong: c.wrong,
      marks: c.marks,
      accuracy: c.attempted > 0 ? (c.correct / c.attempted) * 100 : 0
    }));

    const result: ExamResult = {
      id: `res-${attemptId}`,
      attemptId,
      title: attempt.title,
      mode: attempt.mode,
      totalQuestions: attempt.questions.length,
      attemptedCount,
      correctCount,
      wrongCount,
      unattemptedCount,
      positiveMarks,
      negativeMarks,
      netScore,
      maxPossibleScore,
      percentage: Number(percentage.toFixed(2)),
      accuracy: Number(accuracy.toFixed(2)),
      timeTakenSeconds,
      totalTimeSeconds: attempt.durationMinutes * 60,
      violationsCount: attempt.violationsCount || 0,
      submittedAt: new Date().toISOString(),
      markingScheme: scheme,
      categoryBreakdown,
      topicBreakdown,
      difficultyBreakdown,
      questionsReview
    };

    this.data.results[attemptId] = result;
    this.persist();
    return result;
  }

  public getResult(attemptId: string): ExamResult | undefined {
    return this.data.results[attemptId];
  }

  // ================= BOOKMARKS =================
  public toggleBookmark(questionId: string): { bookmarked: boolean } {
    if (this.data.bookmarks[questionId]) {
      delete this.data.bookmarks[questionId];
      this.persist();
      return { bookmarked: false };
    }

    const q = this.data.questions[questionId];
    if (!q) return { bookmarked: false };

    this.data.bookmarks[questionId] = {
      id: `bm-${questionId}`,
      questionId: q.id,
      questionText: q.questionText,
      topicId: q.topicId,
      topicName: q.topicName,
      category: q.category,
      difficulty: q.difficulty,
      options: q.options,
      correctOption: q.correctOption,
      explanation: q.explanation,
      savedAt: new Date().toISOString()
    };
    this.persist();
    return { bookmarked: true };
  }

  public getBookmarks(topicId?: string): BookmarkItem[] {
    const all = Object.values(this.data.bookmarks);
    if (topicId) {
      return all.filter(b => b.topicId === topicId);
    }
    return all.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  // ================= STATS & DASHBOARDS =================
  public getUserStats() {
    const results = Object.values(this.data.results);
    const totalTestsCompleted = results.length;

    let totalQuestionsAttempted = 0;
    let totalScore = 0;
    let bestScore = 0;
    let totalAccuracySum = 0;
    let totalTimeSpentMinutes = 0;
    let totalCorrect = 0;
    let totalWrong = 0;

    const topicStats: Record<string, { attempted: number; correct: number; wrong: number; name: string; category: any }> = {};

    const diffStats: Record<DifficultyLevel, { attempted: number; correct: number; wrong: number }> = {
      Easy: { attempted: 0, correct: 0, wrong: 0 },
      Medium: { attempted: 0, correct: 0, wrong: 0 },
      Hard: { attempted: 0, correct: 0, wrong: 0 },
      Expert: { attempted: 0, correct: 0, wrong: 0 }
    };

    results.forEach(res => {
      totalQuestionsAttempted += res.attemptedCount;
      totalCorrect += res.correctCount;
      totalWrong += res.wrongCount;
      totalScore += res.netScore;
      if (res.netScore > bestScore) bestScore = res.netScore;
      totalAccuracySum += res.accuracy;
      totalTimeSpentMinutes += Math.round(res.timeTakenSeconds / 60);

      res.topicBreakdown.forEach(tb => {
        if (!topicStats[tb.topicId]) {
          topicStats[tb.topicId] = { attempted: 0, correct: 0, wrong: 0, name: tb.topicName, category: tb.category };
        }
        topicStats[tb.topicId].attempted += tb.attempted;
        topicStats[tb.topicId].correct += tb.correct;
        topicStats[tb.topicId].wrong += tb.wrong;
      });

      res.difficultyBreakdown.forEach(dbItem => {
        if (diffStats[dbItem.difficulty]) {
          diffStats[dbItem.difficulty].attempted += dbItem.attempted;
          diffStats[dbItem.difficulty].correct += dbItem.correct;
          diffStats[dbItem.difficulty].wrong += dbItem.wrong;
        }
      });
    });

    const averageScore = totalTestsCompleted > 0 ? Number((totalScore / totalTestsCompleted).toFixed(1)) : 0;
    const averageAccuracy = (totalCorrect + totalWrong) > 0 ? Number(((totalCorrect / (totalCorrect + totalWrong)) * 100).toFixed(1)) : 0;

    const questionsList = Object.values(this.data.questions).filter(q => q.status === 'active');
    const quantCount = questionsList.filter(q => q.category === 'quantitative').length;
    const logicalCount = questionsList.filter(q => q.category === 'logical').length;
    const verbalCount = questionsList.filter(q => q.category === 'verbal').length;

    // Build comprehensive topic progress array
    const topicProgress = ALL_TOPICS.map(topic => {
      const ts = topicStats[topic.id] || { attempted: 0, correct: 0, wrong: 0 };
      const qCount = questionsList.filter(q => q.topicId === topic.id).length;
      return {
        topicId: topic.id,
        topicName: topic.name,
        category: topic.category,
        attempted: ts.attempted,
        correct: ts.correct,
        wrong: ts.wrong,
        accuracy: ts.attempted > 0 ? Number(((ts.correct / ts.attempted) * 100).toFixed(1)) : 0,
        questionsBankCount: qCount
      };
    });

    // Weak and strong topics
    const attemptedTopicProgress = topicProgress.filter(t => t.attempted >= 2);
    attemptedTopicProgress.sort((a, b) => a.accuracy - b.accuracy);
    const weakTopics = attemptedTopicProgress.slice(0, 4).map(t => ({ topicName: t.topicName, accuracy: t.accuracy, attempts: t.attempted }));
    const strongTopics = [...attemptedTopicProgress].reverse().slice(0, 4).map(t => ({ topicName: t.topicName, accuracy: t.accuracy, attempts: t.attempted }));

    // Difficulty breakdown progress
    const difficultyProgress: Record<DifficultyLevel, { difficulty: DifficultyLevel; attempted: number; correct: number; wrong: number; accuracy: number }> = {
      Easy: {
        difficulty: 'Easy',
        attempted: diffStats.Easy.attempted,
        correct: diffStats.Easy.correct,
        wrong: diffStats.Easy.wrong,
        accuracy: diffStats.Easy.attempted > 0 ? Number(((diffStats.Easy.correct / diffStats.Easy.attempted) * 100).toFixed(1)) : 0
      },
      Medium: {
        difficulty: 'Medium',
        attempted: diffStats.Medium.attempted,
        correct: diffStats.Medium.correct,
        wrong: diffStats.Medium.wrong,
        accuracy: diffStats.Medium.attempted > 0 ? Number(((diffStats.Medium.correct / diffStats.Medium.attempted) * 100).toFixed(1)) : 0
      },
      Hard: {
        difficulty: 'Hard',
        attempted: diffStats.Hard.attempted,
        correct: diffStats.Hard.correct,
        wrong: diffStats.Hard.wrong,
        accuracy: diffStats.Hard.attempted > 0 ? Number(((diffStats.Hard.correct / diffStats.Hard.attempted) * 100).toFixed(1)) : 0
      },
      Expert: {
        difficulty: 'Expert',
        attempted: diffStats.Expert.attempted,
        correct: diffStats.Expert.correct,
        wrong: diffStats.Expert.wrong,
        accuracy: diffStats.Expert.attempted > 0 ? Number(((diffStats.Expert.correct / diffStats.Expert.attempted) * 100).toFixed(1)) : 0
      }
    };

    const quantAttempted = results.reduce((acc, r) => acc + (r.categoryBreakdown.find(c => c.category === 'quantitative')?.attempted || 0), 0);
    const quantCorrect = results.reduce((acc, r) => acc + (r.categoryBreakdown.find(c => c.category === 'quantitative')?.correct || 0), 0);
    const logicalAttempted = results.reduce((acc, r) => acc + (r.categoryBreakdown.find(c => c.category === 'logical')?.attempted || 0), 0);
    const logicalCorrect = results.reduce((acc, r) => acc + (r.categoryBreakdown.find(c => c.category === 'logical')?.correct || 0), 0);
    const verbalAttempted = results.reduce((acc, r) => acc + (r.categoryBreakdown.find(c => c.category === 'verbal')?.attempted || 0), 0);
    const verbalCorrect = results.reduce((acc, r) => acc + (r.categoryBreakdown.find(c => c.category === 'verbal')?.correct || 0), 0);

    return {
      totalTestsCompleted,
      totalQuestionsAttempted,
      totalCorrect,
      totalWrong,
      averageScore,
      bestScore,
      averageAccuracy,
      totalTimeSpentMinutes,
      categoryProgress: {
        quantitative: {
          attempted: quantAttempted,
          correct: quantCorrect,
          accuracy: quantAttempted > 0 ? Number(((quantCorrect / quantAttempted) * 100).toFixed(1)) : 0,
          questionsBankCount: quantCount
        },
        logical: {
          attempted: logicalAttempted,
          correct: logicalCorrect,
          accuracy: logicalAttempted > 0 ? Number(((logicalCorrect / logicalAttempted) * 100).toFixed(1)) : 0,
          questionsBankCount: logicalCount
        },
        verbal: {
          attempted: verbalAttempted,
          correct: verbalCorrect,
          accuracy: verbalAttempted > 0 ? Number(((verbalCorrect / verbalAttempted) * 100).toFixed(1)) : 0,
          questionsBankCount: verbalCount
        }
      },
      difficultyProgress,
      topicProgress,
      weakTopics,
      strongTopics,
      recentAttempts: results.slice(-5).reverse().map(r => ({
        id: r.attemptId,
        title: r.title,
        score: r.netScore,
        maxScore: r.maxPossibleScore,
        accuracy: r.accuracy,
        date: r.submittedAt
      }))
    };
  }

  public getAdminStats() {
    const allQ = Object.values(this.data.questions);
    const active = allQ.filter(q => q.status === 'active');
    const pending = allQ.filter(q => q.status === 'pending_review');

    const catCounts = {
      quantitative: active.filter(q => q.category === 'quantitative').length,
      logical: active.filter(q => q.category === 'logical').length,
      verbal: active.filter(q => q.category === 'verbal').length
    };

    const diffCounts: Record<DifficultyLevel, number> = {
      Easy: active.filter(q => q.difficulty === 'Easy').length,
      Medium: active.filter(q => q.difficulty === 'Medium').length,
      Hard: active.filter(q => q.difficulty === 'Hard').length,
      Expert: active.filter(q => q.difficulty === 'Expert').length
    };

    const results = Object.values(this.data.results);
    const totalAttempts = results.length;
    const avgScore = totalAttempts > 0 ? Number((results.reduce((acc, r) => acc + r.netScore, 0) / totalAttempts).toFixed(1)) : 0;
    const avgAccuracy = totalAttempts > 0 ? Number((results.reduce((acc, r) => acc + r.accuracy, 0) / totalAttempts).toFixed(1)) : 0;

    return {
      totalQuestions: allQ.length,
      totalActiveQuestions: active.length,
      totalPendingQuestions: pending.length,
      totalAttempts,
      averageScore: avgScore,
      averageAccuracy: avgAccuracy,
      questionsPerCategory: catCounts,
      questionsPerDifficulty: diffCounts,
      topPracticedTopics: [
        { topicName: 'Percentages', attemptsCount: 142 },
        { topicName: 'Time and Work', attemptsCount: 118 },
        { topicName: 'Number Series', attemptsCount: 96 },
        { topicName: 'Syllogism', attemptsCount: 88 },
        { topicName: 'Grammar', attemptsCount: 75 }
      ]
    };
  }

  // ================= SETTINGS =================
  public getSettings(): QuizSettings {
    return { ...this.data.settings };
  }

  public updateSettings(updates: Partial<QuizSettings>): QuizSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.persist();
    return this.data.settings;
  }
}

export const db = new AptitudeDatabase();
