import { GoogleGenAI, Type } from '@google/genai';
import { Question, DifficultyLevel } from '../types/quiz';
import { TOPIC_BY_ID } from '../data/topics';
import { generateQuestionForTopic } from './generators/procedural-generator';

export interface GeneratedQuestionPayload {
  topicId: string;
  difficulty: DifficultyLevel;
  count: number;
  useAi: boolean;
}

export async function generateQuestionsBatch(payload: GeneratedQuestionPayload): Promise<{
  questions: Question[];
  source: 'ai' | 'procedural';
  errors?: string[];
}> {
  const { topicId, difficulty, count, useAi } = payload;
  const topic = TOPIC_BY_ID.get(topicId);
  if (!topic) {
    throw new Error(`Topic '${topicId}' not found.`);
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (useAi && apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a senior exam creator for top competitive exams (CAT, GMAT, GRE, GATE, Banking PO).
Generate exactly ${Math.min(count, 10)} high-quality, non-repetitive multiple-choice aptitude questions for:
Topic: "${topic.name}" (${topic.category} aptitude)
Difficulty: "${difficulty}"

Requirements:
1. Provide exactly four distinct options for each question.
2. Indicate the zero-based index of the correct answer (0, 1, 2, or 3).
3. Provide a clear, comprehensive, step-by-step mathematical/logical explanation demonstrating the exact formula and calculation.
4. Avoid ambiguous phrasing.
5. Provide relevant subtopics and tags.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionText: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      minItems: 4,
                      maxItems: 4
                    },
                    correctOption: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    subtopic: { type: Type.STRING },
                    tags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ['questionText', 'options', 'correctOption', 'explanation']
                }
              }
            },
            required: ['questions']
          }
        }
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      const rawQuestions = parsed.questions || [];

      const validatedQuestions: Question[] = [];
      const now = new Date().toISOString();

      for (const item of rawQuestions) {
        if (!item.questionText || !Array.isArray(item.options) || item.options.length !== 4) continue;
        if (typeof item.correctOption !== 'number' || item.correctOption < 0 || item.correctOption > 3) continue;

        // Check duplicate options
        const uniqueOpts = new Set(item.options.map((o: string) => o.trim().toLowerCase()));
        if (uniqueOpts.size !== 4) continue;

        validatedQuestions.push({
          id: `ai-${topicId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
          topicId: topic.id,
          topicName: topic.name,
          category: topic.category,
          subtopic: item.subtopic || topic.subtopics[0] || 'Core Concepts',
          difficulty,
          questionText: item.questionText.trim(),
          options: [item.options[0], item.options[1], item.options[2], item.options[3]],
          correctOption: item.correctOption,
          explanation: item.explanation || 'Verified correct calculation.',
          tags: Array.isArray(item.tags) ? item.tags : [topic.name, difficulty],
          source: 'Gemini AI Generator',
          status: 'pending_review', // Strict specification: Store generated questions as 'Pending Review'
          createdAt: now,
          updatedAt: now
        });
      }

      if (validatedQuestions.length > 0) {
        return { questions: validatedQuestions, source: 'ai' };
      }
    } catch (err: any) {
      console.warn('AI generation encountered error, falling back to procedural engine:', err?.message);
    }
  }

  // Fallback or explicit procedural engine
  const generated: Question[] = [];
  for (let i = 0; i < count; i++) {
    const q = generateQuestionForTopic(topicId, difficulty, i);
    if (q) {
      // By default when admin explicitly generates, mark status pending review or active
      generated.push({
        ...q,
        status: useAi ? 'pending_review' : 'active'
      });
    }
  }

  return { questions: generated, source: 'procedural' };
}
