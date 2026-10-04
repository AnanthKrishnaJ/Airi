import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { ALL_TOPICS, TOPIC_BY_ID } from './src/data/topics';
import { db } from './src/server/db';
import { generateQuestionsBatch } from './src/server/ai-generator';
import { Question, DifficultyLevel } from './src/types/quiz';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================= API ROUTES =================

// 1. Topics API
app.get('/api/topics', (req, res) => {
  const { category } = req.query;
  const questions = db.getQuestions({ limit: 10000 }).items;

  // Compute question count per topic
  const countsByTopic: Record<string, number> = {};
  questions.forEach(q => {
    countsByTopic[q.topicId] = (countsByTopic[q.topicId] || 0) + 1;
  });

  let topics = ALL_TOPICS.map(t => ({
    ...t,
    totalQuestionsCount: countsByTopic[t.id] || 0
  }));

  if (category && typeof category === 'string') {
    topics = topics.filter(t => t.category === category);
  }

  res.json({ topics, total: topics.length });
});

app.get('/api/topics/:id', (req, res) => {
  const topic = TOPIC_BY_ID.get(req.params.id);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  const { total } = db.getQuestions({ topicId: topic.id });
  res.json({ ...topic, totalQuestionsCount: total });
});

// 2. Questions API (Search, Filter, Paginate)
app.get('/api/questions', (req, res) => {
  const { topicId, category, difficulty, status, search, limit, offset } = req.query;
  const result = db.getQuestions({
    topicId: topicId as string,
    category: category as string,
    difficulty: difficulty as string,
    status: status as any,
    search: search as string,
    limit: limit ? parseInt(limit as string) : 25,
    offset: offset ? parseInt(offset as string) : 0
  });
  res.json(result);
});

// Pending Review Questions (MUST be registered before /api/questions/:id)
app.get('/api/questions/pending', (req, res) => {
  const result = db.getQuestions({ status: 'pending_review', limit: 100 });
  res.json(result);
});

// Approve Pending Question
app.post('/api/questions/pending/:id/approve', (req, res) => {
  const approved = db.approveQuestion(req.params.id);
  if (!approved) return res.status(404).json({ error: 'Question not found' });
  res.json({ success: true, question: approved });
});

// Reject Pending Question
app.post('/api/questions/pending/:id/reject', (req, res) => {
  const rejected = db.rejectQuestion(req.params.id);
  if (!rejected) return res.status(404).json({ error: 'Question not found' });
  res.json({ success: true });
});

// Question Generator (AI / Procedural with Validation)
app.post('/api/questions/generate', async (req, res) => {
  try {
    const { topicId, difficulty, count = 10, useAi = false } = req.body;
    const topic = TOPIC_BY_ID.get(topicId);
    if (!topic) return res.status(400).json({ error: 'Invalid topicId' });

    const result = await generateQuestionsBatch({
      topicId,
      difficulty: difficulty || 'Medium',
      count: Math.min(Math.max(1, count), 100),
      useAi: !!useAi
    });

    // Add generated questions to store
    db.addQuestionsBatch(result.questions);

    res.json({
      success: true,
      count: result.questions.length,
      source: result.source,
      status: result.questions[0]?.status || 'pending_review',
      questions: result.questions
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Question Import / Export (MUST be registered before /api/questions/:id)
app.post('/api/questions/import', (req, res) => {
  try {
    const { format, data } = req.body;
    let questionsToAdd: Question[] = [];
    const now = new Date().toISOString();

    if (format === 'json') {
      const items = Array.isArray(data) ? data : (typeof data === 'string' ? JSON.parse(data) : []);
      if (!Array.isArray(items)) return res.status(400).json({ error: 'Data must be an array of questions' });

      for (const item of items) {
        let topic = TOPIC_BY_ID.get(item.topicId) || ALL_TOPICS.find(t => t.name.toLowerCase() === (item.topic || '').toLowerCase());
        if (!topic) topic = ALL_TOPICS[0];

        if (!item.question && !item.questionText) continue;
        const qText = item.questionText || item.question;
        const opts = item.options;
        if (!Array.isArray(opts) || opts.length !== 4) continue;

        let correctIdx = 0;
        if (typeof item.correctOption === 'number') {
          correctIdx = item.correctOption;
        } else if (item.correctAnswer) {
          const found = opts.indexOf(item.correctAnswer);
          correctIdx = found !== -1 ? found : 0;
        }

        questionsToAdd.push({
          id: `imp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
          topicId: topic.id,
          topicName: topic.name,
          category: topic.category,
          subtopic: item.subtopic || topic.subtopics[0] || 'General',
          difficulty: (item.difficulty as DifficultyLevel) || 'Medium',
          questionText: qText,
          options: [opts[0], opts[1], opts[2], opts[3]],
          correctOption: correctIdx,
          explanation: item.explanation || 'Verified correct answer.',
          tags: item.tags || [topic.name],
          status: 'active',
          createdAt: now,
          updatedAt: now
        });
      }
    } else if (format === 'csv') {
      const lines = (typeof data === 'string' ? data : '').split('\n').filter(l => l.trim().length > 0);
      if (lines.length <= 1) return res.status(400).json({ error: 'CSV has no data rows' });

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 8) {
          const topicName = parts[0];
          const diff = (parts[1] as DifficultyLevel) || 'Medium';
          const qText = parts[2];
          const opts: [string, string, string, string] = [parts[3], parts[4], parts[5], parts[6]];
          const correctOpt = parseInt(parts[7]) || 0;
          const exp = parts[8] || 'Explanation provided in reference.';

          let topic = ALL_TOPICS.find(t => t.name.toLowerCase() === topicName.toLowerCase()) || ALL_TOPICS[0];

          questionsToAdd.push({
            id: `imp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
            topicId: topic.id,
            topicName: topic.name,
            category: topic.category,
            subtopic: topic.subtopics[0] || 'General',
            difficulty: diff,
            questionText: qText,
            options: opts,
            correctOption: Math.min(3, Math.max(0, correctOpt)),
            explanation: exp,
            tags: [topic.name, diff],
            status: 'active',
            createdAt: now,
            updatedAt: now
          });
        }
      }
    }

    if (questionsToAdd.length === 0) {
      return res.status(400).json({ error: 'No valid questions could be extracted from input' });
    }

    const inserted = db.addQuestionsBatch(questionsToAdd);
    res.json({ success: true, importedCount: inserted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Export Questions (MUST be registered before /api/questions/:id)
app.get('/api/questions/export', (req, res) => {
  const { format, topicId } = req.query;
  const questions = db.getQuestions({ topicId: topicId as string, limit: 10000 }).items;

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="aptitude-questions.csv"');
    const header = 'Topic,Difficulty,Question,OptionA,OptionB,OptionC,OptionD,CorrectOption,Explanation\n';
    const rows = questions.map(q => {
      const esc = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
      return `${esc(q.topicName)},${esc(q.difficulty)},${esc(q.questionText)},${esc(q.options[0])},${esc(q.options[1])},${esc(q.options[2])},${esc(q.options[3])},${q.correctOption},${esc(q.explanation)}`;
    }).join('\n');
    return res.send(header + rows);
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="aptitude-questions.json"');
  res.json(questions);
});

// Create Question (Admin)
app.post('/api/questions', (req, res) => {
  try {
    const { topicId, difficulty, questionText, options, correctOption, explanation, tags, subtopic } = req.body;
    const topic = TOPIC_BY_ID.get(topicId);
    if (!topic) return res.status(400).json({ error: 'Valid topicId is required' });
    if (!questionText || !Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ error: 'Question text and exactly 4 options are required' });
    }
    if (typeof correctOption !== 'number' || correctOption < 0 || correctOption > 3) {
      return res.status(400).json({ error: 'Valid correctOption index (0-3) is required' });
    }

    const newQ: Question = {
      id: `manual-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      topicId: topic.id,
      topicName: topic.name,
      category: topic.category,
      subtopic: subtopic || topic.subtopics[0] || 'General',
      difficulty: difficulty || 'Medium',
      questionText: questionText.trim(),
      options: [options[0].trim(), options[1].trim(), options[2].trim(), options[3].trim()],
      correctOption,
      explanation: explanation || 'Standard step-by-step logic applied.',
      tags: Array.isArray(tags) ? tags : [topic.name, difficulty || 'Medium'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.addQuestion(newQ);
    res.status(201).json(newQ);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Parameterized Single Question Routes (MUST come after all fixed subpaths like /pending, /generate, /export, /import)
app.get('/api/questions/:id', (req, res) => {
  const q = db.getQuestionById(req.params.id);
  if (!q) return res.status(404).json({ error: 'Question not found' });
  res.json(q);
});

// Update Question
app.put('/api/questions/:id', (req, res) => {
  const updated = db.updateQuestion(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Question not found' });
  res.json(updated);
});

// Delete Question
app.delete('/api/questions/:id', (req, res) => {
  const success = db.deleteQuestion(req.params.id);
  if (!success) return res.status(404).json({ error: 'Question not found' });
  res.json({ success: true });
});

// 5. Quiz & Attempts Engine
app.post('/api/quiz/start', (req, res) => {
  try {
    const {
      title,
      mode = 'exam',
      category = 'full',
      topicId,
      difficulty = 'mixed',
      count = 20,
      durationMinutes = 20
    } = req.body;

    const { attempt } = db.createAttempt({
      title: title || (topicId ? `${TOPIC_BY_ID.get(topicId)?.name} Practice` : 'Full Aptitude Test'),
      mode: mode as 'practice' | 'exam',
      category: category as any,
      topicId,
      difficulty,
      count: Number(count),
      durationMinutes: Number(durationMinutes)
    });

    res.status(201).json(attempt);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attempts/:id', (req, res) => {
  const attempt = db.getAttempt(req.params.id);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

  // Calculate live remaining seconds
  const elapsed = Math.floor((Date.now() - attempt.startTime) / 1000);
  const total = attempt.durationMinutes * 60;
  attempt.remainingSeconds = Math.max(0, total - elapsed);

  res.json(attempt);
});

// Auto-save user answer in real-time
app.post('/api/attempts/:id/answer', (req, res) => {
  const { questionId, selectedOption, isMarkedForReview, visited, timeSpentSeconds } = req.body;
  const updated = db.saveAnswer(req.params.id, questionId, {
    selectedOption,
    isMarkedForReview,
    visited,
    timeSpentSeconds
  });

  if (!updated) return res.status(400).json({ error: 'Could not record answer' });
  res.json({ success: true, answer: updated });
});

// Record anti-cheating violation (e.g. tab switch)
app.post('/api/attempts/:id/violation', (req, res) => {
  const count = db.recordViolation(req.params.id);
  res.json({ violationsCount: count });
});

// Submit Attempt (Scoring Engine)
app.post('/api/attempts/:id/submit', (req, res) => {
  const result = db.submitAttempt(req.params.id);
  if (!result) return res.status(404).json({ error: 'Attempt not found or invalid' });
  res.json(result);
});

// Get Result
app.get('/api/results/:id', (req, res) => {
  const result = db.getResult(req.params.id);
  if (!result) return res.status(404).json({ error: 'Result not found' });
  res.json(result);
});

// 6. Bookmarks API
app.get('/api/bookmarks', (req, res) => {
  const { topicId } = req.query;
  const list = db.getBookmarks(topicId as string);
  res.json({ bookmarks: list, total: list.length });
});

app.post('/api/bookmarks/toggle', (req, res) => {
  const { questionId } = req.body;
  if (!questionId) return res.status(400).json({ error: 'questionId is required' });
  const result = db.toggleBookmark(questionId);
  res.json(result);
});

// 7. Dashboards & Analytics
app.get('/api/stats/user', (req, res) => {
  const stats = db.getUserStats();
  res.json(stats);
});

app.get('/api/stats/admin', (req, res) => {
  const stats = db.getAdminStats();
  res.json(stats);
});

// 8. Settings API
app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.put('/api/settings', (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

// ================= VITE DEV MIDDLEWARE & PRODUCTION STATIC =================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AptiMaster Pro server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
