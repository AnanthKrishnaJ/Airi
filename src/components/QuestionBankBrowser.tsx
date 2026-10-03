import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, HelpCircle, Bookmark, Check, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ALL_TOPICS } from '../data/topics';
import { Question, DifficultyLevel } from '../types/quiz';
import { fetchQuestions, toggleBookmark } from '../services/api';

export const QuestionBankBrowser: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadQuestions();
  }, [search, selectedTopic, selectedDifficulty, selectedCategory, page]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetchQuestions({
        search,
        topicId: selectedTopic || undefined,
        difficulty: selectedDifficulty || undefined,
        category: selectedCategory || undefined,
        limit: pageSize,
        offset: page * pageSize
      });
      setQuestions(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSolution = (qId: string) => {
    setExpandedSolutions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleBookmark = async (qId: string) => {
    try {
      const res = await toggleBookmark(qId);
      setBookmarkedMap(prev => ({ ...prev, [qId]: res.bookmarked }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-16 bg-white text-red-700">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-red-200 pb-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-red-600 font-bold flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            <span>MADE BY ANANTH · AIRI COMPENDIUM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-red-700 flex items-center space-x-2 mt-0.5">
            <Database className="h-6 w-6 text-red-600" />
            <span>Master Question Bank ({total.toLocaleString()} Questions)</span>
          </h1>
          <p className="text-xs sm:text-sm text-red-800/80 mt-1">
            Browse, search, and self-study verified multiple-choice questions with step-by-step mathematical reasoning.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
          <input
            type="text"
            placeholder="Search text, formula, keywords..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-red-200 bg-white text-xs text-red-700 placeholder:text-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => {
            setSelectedCategory(e.target.value);
            setSelectedTopic('');
            setPage(0);
          }}
          className="p-2 rounded-lg border border-red-200 bg-white text-xs font-medium text-red-700 focus:outline-none cursor-pointer"
        >
          <option value="">All Categories</option>
          <option value="quantitative">Quantitative Aptitude</option>
          <option value="logical">Logical Reasoning</option>
          <option value="verbal">Verbal Ability</option>
        </select>

        <select
          value={selectedTopic}
          onChange={e => {
            setSelectedTopic(e.target.value);
            setPage(0);
          }}
          className="p-2 rounded-lg border border-red-200 bg-white text-xs font-medium text-red-700 focus:outline-none cursor-pointer"
        >
          <option value="">All 62 Topics</option>
          {ALL_TOPICS.filter(t => !selectedCategory || t.category === selectedCategory).map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={selectedDifficulty}
          onChange={e => {
            setSelectedDifficulty(e.target.value);
            setPage(0);
          }}
          className="p-2 rounded-lg border border-red-200 bg-white text-xs font-medium text-red-700 focus:outline-none cursor-pointer"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
          <option value="Expert">Expert</option>
        </select>
      </div>

      {/* Questions Listing */}
      {loading ? (
        <div className="text-center py-16 text-red-400 font-serif">
          Querying question repository...
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 text-red-400 font-serif">
          No questions matched your current filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isSolutionOpen = !!expandedSolutions[q.id];
            const isBookmarked = !!bookmarkedMap[q.id];

            return (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-red-200 p-5 shadow-xs space-y-4 hover:border-red-400 transition"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-red-50 text-red-700 border border-red-200">
                      #{page * pageSize + idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-red-700">{q.topicName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-red-200 bg-red-50 text-red-700 font-bold">
                      {q.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleBookmark(q.id)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        isBookmarked
                          ? 'bg-red-50 text-red-600 border-red-300 shadow-2xs'
                          : 'text-red-300 hover:text-red-600 border-red-200'
                      }`}
                      title="Bookmark Question"
                    >
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-red-600' : ''}`} />
                    </button>

                    <button
                      onClick={() => handleToggleSolution(q.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                        isSolutionOpen
                          ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-600 shadow-xs'
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {isSolutionOpen ? 'Hide Solution' : 'View Solution'}
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-sm sm:text-base font-serif font-medium text-red-800 leading-relaxed whitespace-pre-wrap">
                  {q.questionText}
                </div>

                {/* 4 Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                  {q.options.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isCorrect = isSolutionOpen && oIdx === q.correctOption;

                    return (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-xl border flex items-center space-x-2.5 transition ${
                          isCorrect
                            ? 'border-red-600 bg-red-50 text-red-700 font-bold ring-1 ring-red-500'
                            : 'border-red-200 bg-white text-red-800'
                        }`}
                      >
                        <div
                          className={`h-6 w-6 rounded-md font-mono flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCorrect
                              ? 'bg-red-600 text-white shadow-2xs'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {letter}
                        </div>
                        <div className="flex-1">{opt}</div>
                        {isCorrect && (
                          <span className="text-[11px] font-mono font-bold text-red-700 shrink-0">
                            ✓ Key Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Expandable Explanation */}
                {isSolutionOpen && (
                  <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 space-y-2 animate-in fade-in">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-red-600 flex items-center space-x-1.5">
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>Mathematical & Conceptual Proof</span>
                    </div>
                    <div className="text-xs sm:text-sm text-red-800 font-mono whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-red-200">
                      {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-red-200">
        <div className="text-xs text-red-600 font-mono">
          Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total.toLocaleString()}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3.5 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-700 disabled:opacity-30 hover:bg-red-50 cursor-pointer flex items-center space-x-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>
          <span className="text-xs font-mono font-semibold px-2 text-red-700">Page {page + 1}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * pageSize >= total}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-bold disabled:opacity-30 cursor-pointer flex items-center space-x-1 shadow-sm shadow-red-600/20 border border-red-500/30"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
