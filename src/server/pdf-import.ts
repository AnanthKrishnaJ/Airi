import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ALL_TOPICS, TOPIC_BY_ID } from '../data/topics';
import type { Question, DifficultyLevel } from '../types/quiz';

function normalizeWhitespace(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/\r/g, '').replace(/\s+/g, ' ').trim();
}

function toOptionIndex(value: string): number {
  const normalized = value.toUpperCase().replace(/[^A-D1-4]/g, '');
  if (!normalized) return -1;
  const map: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
  return map[normalized] ?? -1;
}

export async function extractTextFromPdfBase64(base64: string): Promise<string> {
  const binary = Buffer.from(base64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(binary) }).promise;

  let fullText = '';
  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (pageText) {
      fullText += `${fullText ? '\n\n' : ''}${pageText}`;
    }
  }

  return fullText;
}

export function parseQuestionsFromPdfText(rawText: string): { questionText: string; options: [string, string, string, string]; correctOption: number; explanation: string }[] {
  const text = rawText.replace(/\u00a0/g, ' ').replace(/\r/g, '').trim();
  if (!text) return [];

  const blocks: string[] = [];
  const lines = text.split(/\n+/).map(line => line.trim()).filter(Boolean);
  let current: string[] = [];

  const startsQuestion = (line: string) => {
    return /^\d+[\.)]\s+/i.test(line) || /^Q(?:uestion)?\s*\d+[:\.)]?/i.test(line) || /^Question\s+\d+[:\.)]?/i.test(line);
  };

  for (const line of lines) {
    if (startsQuestion(line) && current.length) {
      blocks.push(current.join('\n'));
      current = [];
    }

    if (startsQuestion(line)) {
      current.push(line);
      continue;
    }

    if (current.length) {
      current.push(line);
    }
  }

  if (current.length) {
    blocks.push(current.join('\n'));
  }

  if (blocks.length === 0) {
    blocks.push(text);
  }

  const parsed: { questionText: string; options: [string, string, string, string]; correctOption: number; explanation: string }[] = [];

  for (const block of blocks) {
    const normalizedBlock = block.replace(/\s*\n\s*/g, '\n').trim();
    if (!normalizedBlock) continue;

    const answerMatch = normalizedBlock.match(/(?:Correct\s*Answer|Correct\s*Option|Answer|Ans)\s*[:\-]?\s*([A-D1-4])/i);
    const correctIndex = answerMatch ? toOptionIndex(answerMatch[1]) : -1;

    const optionEntries = normalizedBlock
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const match = line.match(/^\s*(?:[A-D]|[1-4])[\.)]\s*(.+)$/i);
        return match ? normalizeWhitespace(match[1]) : null;
      })
      .filter((entry): entry is string => Boolean(entry));

    const options: string[] = [];
    for (const entry of optionEntries) {
      if (!options.includes(entry)) {
        options.push(entry);
      }
    }

    let questionText = normalizedBlock;
    for (const option of options) {
      questionText = questionText.replace(option, '').trim();
    }
    questionText = questionText.replace(new RegExp(`(?:^|\\n)\\s*(?:Correct\\s*Answer|Correct\\s*Option|Answer|Ans)\\s*[:\\-]?\\s*[A-D1-4].*?$`, 'im'), '').trim();
    questionText = questionText.replace(new RegExp(`(?:^|\\n)\\s*(?:[A-D]|[1-4])\\s*[\\.)]\\s*`, 'g'), ' ').trim();
    questionText = normalizeWhitespace(questionText).replace(/\s*[:\-]\s*$/g, '');

    if (options.length !== 4) {
      const fallbackOptions = Array.from(normalizedBlock.matchAll(/(?:^|\n)\s*(?:\()?\s*(?:A|B|C|D)\s*[\.):]\s*([^\n]+)/g));
      const collected = fallbackOptions.map(match => normalizeWhitespace(match[1]));
      if (collected.length === 4) {
        options.splice(0, options.length, ...collected);
      }
    }

    if (options.length !== 4) continue;

    const cleanedOptions: [string, string, string, string] = [
      normalizeWhitespace(options[0] || '').replace(/^A\s*[\.):]\s*/i, ''),
      normalizeWhitespace(options[1] || '').replace(/^B\s*[\.):]\s*/i, ''),
      normalizeWhitespace(options[2] || '').replace(/^C\s*[\.):]\s*/i, ''),
      normalizeWhitespace(options[3] || '').replace(/^D\s*[\.):]\s*/i, ''),
    ];

    const finalQuestionText = normalizeWhitespace(questionText || normalizedBlock.replace(new RegExp(`(?:^|\\n)\\s*(?:[A-D]|[1-4])\\s*[\\.)].*?(?=(?:\\n\\s*(?:[A-D]|[1-4])\\s*[\\.)]|$))`, 'gs'), '').trim());

    const finalCorrectIndex = correctIndex >= 0 ? correctIndex : 0;
    const explanation = correctIndex >= 0 ? `Answer key indicates option ${String.fromCharCode(65 + finalCorrectIndex)}.` : 'Answer determined from the provided PDF key or question solution.';

    if (!finalQuestionText) continue;

    parsed.push({
      questionText: finalQuestionText,
      options: cleanedOptions,
      correctOption: finalCorrectIndex,
      explanation
    });
  }

  return parsed;
}

export function getTopicSelectionFromText(rawText: string) {
  const haystack = rawText.toLowerCase();
  const topic = ALL_TOPICS.find(item => {
    const matchName = item.name.toLowerCase();
    const matchSubtopics = item.subtopics.some(sub => haystack.includes(sub.toLowerCase()));
    return haystack.includes(matchName) || matchSubtopics;
  });

  if (topic) return topic;
  return ALL_TOPICS[0];
}

export function buildImportedQuestionEntries(rawText: string): Array<Omit<Question, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }> {
  const parsed = parseQuestionsFromPdfText(rawText);
  const topic = getTopicSelectionFromText(rawText);
  const now = new Date().toISOString();

  return parsed.map((item, index) => ({
    id: `pdf-import-${Date.now().toString(36)}-${index}`,
    topicId: topic.id,
    topicName: topic.name,
    category: topic.category,
    subtopic: topic.subtopics[0] || 'General',
    difficulty: ('Medium' as DifficultyLevel),
    questionText: item.questionText,
    options: item.options,
    correctOption: item.correctOption,
    explanation: item.explanation,
    tags: ['pdf-import', topic.name],
    source: 'PDF Upload',
    status: 'active',
    createdAt: now,
    updatedAt: now
  }));
}
