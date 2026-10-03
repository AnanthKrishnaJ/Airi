import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Target,
  TrendingDown,
  BarChart3,
  Bookmark,
  ArrowLeft,
  RotateCcw,
  Check,
  X,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  Share2,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ExamResult, QuestionReviewItem } from '../types/quiz';
import { toggleBookmark } from '../services/api';

interface ExamResultViewProps {
  result: ExamResult;
  onRetake: () => void;
  onBackToDashboard: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  result,
  onRetake,
  onBackToDashboard
}) => {
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'wrong' | 'unattempted' | 'marked'>('all');
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    result.questionsReview.forEach(q => {
      if (q.isBookmarked) map[q.id] = true;
    });
    return map;
  });

  // Confetti celebration when scorecard appears
  useEffect(() => {
    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#dc2626', '#ef4444', '#f43f5e', '#b91c1c', '#fb7185']
      });
    } catch {
      // Ignore if confetti fails
    }
  }, []);

  const handleToggleBookmark = async (qId: string) => {
    try {
      const res = await toggleBookmark(qId);
      setBookmarkedMap(prev => ({ ...prev, [qId]: res.bookmarked }));
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const filteredQuestions = result.questionsReview.filter(q => {
    if (reviewFilter === 'correct') return q.isCorrect;
    if (reviewFilter === 'wrong') return q.isAttempted && !q.isCorrect;
    if (reviewFilter === 'unattempted') return !q.isAttempted;
    if (reviewFilter === 'marked') return q.isMarkedForReview;
    return true;
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 sm:pb-16 bg-white text-red-700">
      {/* Top Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBackToDashboard}
          className="flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-red-700 hover:text-red-900 cursor-pointer transition"
        >
          <ArrowLeft className="h-4 w-4 text-red-600" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRetake}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-semibold text-xs sm:text-sm shadow-md shadow-red-600/20 transition flex items-center space-x-1.5 cursor-pointer border border-red-500/30"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retake Exam</span>
          </motion.button>
        </div>
      </div>

      {/* Primary Score Summary Card with White & Red Styling */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl border border-red-200 p-6 sm:p-8 shadow-xs relative overflow-hidden"
      >
        {/* Top vibrant animated gradient hairline */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-500 animate-gradient-flow" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center pt-2">
          {/* Main Score & Grade */}
          <div className="lg:col-span-4 text-center lg:text-left space-y-2.5 lg:border-r lg:border-red-100 lg:pr-8">
            <div className="flex items-center justify-center lg:justify-start space-x-2">
              <span className="text-[10px] font-mono tracking-widest text-red-600 uppercase font-bold flex items-center space-x-1">
                <Sparkles className="h-3 w-3 text-red-500" />
                <span>made by Ananth</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold uppercase border border-red-200">
                Official Scorecard
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-red-700 leading-tight">
              {result.title}
            </h1>

            <div className="pt-2">
              <div className="text-5xl sm:text-6xl font-serif font-bold text-red-700 tracking-tight">
                {result.netScore}{' '}
                <span className="text-xl sm:text-2xl font-mono font-normal text-red-400">
                  / {result.maxPossibleScore}
                </span>
              </div>
              <div className="text-xs text-red-600/80 mt-1 font-mono">
                Net Final Score (Accounting for -1.0 negative penalties)
              </div>
            </div>

            {/* Score Progress Bar */}
            <div className="pt-2 space-y-1">
              <div className="w-full bg-red-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(5, result.percentage))}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-500 rounded-full"
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-red-600 font-semibold">
                <span>Score Percentage</span>
                <span className="text-red-700 font-bold">{result.percentage}%</span>
              </div>
            </div>
          </div>

          {/* Detailed Statistics Metrics Cards with White & Red Format */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Correct */}
            <div className="p-4 rounded-xl bg-white border border-red-200 shadow-2xs">
              <div className="flex items-center justify-between text-red-600 text-[10px] font-mono font-bold uppercase mb-1">
                <span>Correct</span>
                <CheckCircle2 className="h-4 w-4 text-red-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-red-700">
                {result.correctCount}
              </div>
              <div className="text-xs text-red-600 font-mono mt-1 font-bold">
                +{result.positiveMarks} marks
              </div>
            </div>

            {/* Wrong */}
            <div className="p-4 rounded-xl bg-white border border-red-200 shadow-2xs">
              <div className="flex items-center justify-between text-red-600 text-[10px] font-mono font-bold uppercase mb-1">
                <span>Wrong</span>
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-red-700">
                {result.wrongCount}
              </div>
              <div className="text-xs text-red-600 font-mono mt-1 font-bold">
                -{result.negativeMarks} marks
              </div>
            </div>

            {/* Unattempted */}
            <div className="p-4 rounded-xl bg-white border border-red-200 shadow-2xs">
              <div className="flex items-center justify-between text-red-600 text-[10px] font-mono font-bold uppercase mb-1">
                <span>Unattempted</span>
                <HelpCircle className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-red-700">
                {result.unattemptedCount}
              </div>
              <div className="text-xs text-red-600/80 font-mono mt-1 font-medium">
                0 penalties
              </div>
            </div>

            {/* Accuracy */}
            <div className="p-4 rounded-xl bg-white border border-red-200 shadow-2xs">
              <div className="flex items-center justify-between text-red-600 text-[10px] font-mono font-bold uppercase mb-1">
                <span>Accuracy</span>
                <Target className="h-4 w-4 text-red-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-red-700">
                {result.accuracy}%
              </div>
              <div className="text-xs text-red-600 font-mono mt-1 font-bold">
                {result.percentage}% net
              </div>
            </div>
          </div>
        </div>

        {/* Supplemental Details */}
        <div className="mt-6 pt-5 border-t border-red-100 flex flex-wrap items-center justify-between gap-4 text-xs text-red-600 font-mono">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-red-600" />
            <span>Time Taken: <strong className="text-red-700 font-bold">{formatTime(result.timeTakenSeconds)}</strong> of {formatTime(result.totalTimeSeconds)}</span>
          </div>
          <div>
            Marking Applied:{' '}
            <strong className="text-red-700 font-bold">
              +{result.markingScheme.correct} Correct
            </strong> · <strong className="text-red-700 font-bold">{result.markingScheme.wrong} Wrong</strong> · <strong className="text-red-600">{result.markingScheme.unattempted} Unattempted</strong>
          </div>
          {result.violationsCount > 0 && (
            <div className="text-red-700 font-bold">
              Tab-switch violations: {result.violationsCount}
            </div>
          )}
        </div>
      </motion.div>

      {/* Topic-Wise Breakdown Table */}
      <div className="bg-white rounded-2xl border border-red-200 p-5 sm:p-6 shadow-xs space-y-4 text-red-700">
        <div className="flex items-center justify-between border-b border-red-100 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-red-600 font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
              <span>SUB-DOMAIN PERFORMANCE</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-red-700 flex items-center space-x-2 mt-0.5">
              <BarChart3 className="h-5 w-5 text-red-600" />
              <span>Topic-Wise Breakdown</span>
            </h2>
            <p className="text-xs text-red-600/80">
              Candidate precision, question count, and negative marks broken down by topic
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-red-50/50">
              <tr className="border-b border-red-200 text-red-700 uppercase text-[10px] font-mono font-bold">
                <th className="py-2.5 px-3">Topic</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">Questions</th>
                <th className="py-2.5 px-3 text-center">Attempted</th>
                <th className="py-2.5 px-3 text-center text-red-700 font-bold">Correct</th>
                <th className="py-2.5 px-3 text-center text-red-600 font-bold">Wrong</th>
                <th className="py-2.5 px-3 text-right">Accuracy</th>
                <th className="py-2.5 px-3 text-right">Net Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100 font-medium">
              {result.topicBreakdown.map(tb => (
                <tr key={tb.topicId} className="hover:bg-red-50/40 transition">
                  <td className="py-2.5 px-3 font-semibold text-red-700">{tb.topicName}</td>
                  <td className="py-2.5 px-3 capitalize text-red-600/80">{tb.category}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-red-700">{tb.totalQuestions}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-red-700">{tb.attempted}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-red-700">{tb.correct}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-red-600">{tb.wrong}</td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    <span className="font-bold text-red-700">
                      {tb.accuracy.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-red-700">
                    {tb.marks >= 0 ? `+${tb.marks}` : tb.marks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Question-by-Question Detailed Review */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-200 pb-3">
          <div>
            <h2 className="text-xl font-serif font-bold text-red-700">
              Question Verification & Step-by-Step Proofs
            </h2>
            <p className="text-xs text-red-600/80">
              Complete review of all questions with full derivations and rationale.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {[
              { id: 'all', label: `All (${result.questionsReview.length})` },
              { id: 'correct', label: `Correct (${result.correctCount})` },
              { id: 'wrong', label: `Wrong (${result.wrongCount})` },
              { id: 'unattempted', label: `Skipped (${result.unattemptedCount})` },
              { id: 'marked', label: 'Marked' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setReviewFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer border ${
                  reviewFilter === f.id
                    ? 'bg-red-600 text-white border-red-600 font-bold shadow-2xs'
                    : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const isBookmarked = !!bookmarkedMap[q.id];

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                className="bg-white rounded-2xl border border-red-200 p-5 sm:p-6 shadow-xs space-y-4 text-red-700"
              >
                {/* Question Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-red-50 text-red-700 border border-red-200">
                      Q {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-red-700">
                      {q.topicName}
                    </span>
                    <span className="text-[10px] font-mono text-red-600 px-1.5 py-0.5 rounded bg-red-50 border border-red-200">
                      {q.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Status Badge */}
                    {q.isCorrect ? (
                      <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-mono font-bold flex items-center space-x-1 border border-red-300">
                        <Check className="h-3.5 w-3.5" />
                        <span>+1.0 Mark</span>
                      </span>
                    ) : q.isAttempted ? (
                      <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-mono font-bold flex items-center space-x-1 border border-red-400">
                        <X className="h-3.5 w-3.5" />
                        <span>-1.0 Mark</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-white text-red-600 text-xs font-mono font-semibold border border-red-200">
                        0.0 (Unattempted)
                      </span>
                    )}

                    {/* Bookmark Toggle */}
                    <button
                      onClick={() => handleToggleBookmark(q.id)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        isBookmarked
                          ? 'bg-red-50 text-red-600 border-red-400 shadow-2xs'
                          : 'bg-white text-red-300 border-red-200 hover:text-red-600'
                      }`}
                      title="Bookmark Question"
                    >
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-red-600' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-base font-serif font-medium text-red-800 leading-relaxed whitespace-pre-wrap">
                  {q.questionText}
                </div>

                {/* Options Review Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {q.options.map((opt, oIdx) => {
                    const isKey = oIdx === q.correctOption;
                    const isUserChoice = oIdx === q.selectedOption;

                    let optStyle = 'border-red-200 bg-white text-red-800';
                    let badge = null;

                    if (isKey) {
                      optStyle = 'border-red-600 bg-red-50 text-red-800 font-bold ring-1 ring-red-500';
                      badge = (
                        <span className="text-[10px] font-mono font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-300">
                          Correct Key
                        </span>
                      );
                    } else if (isUserChoice && !q.isCorrect) {
                      optStyle = 'border-red-400 bg-red-100/50 text-red-800 font-bold ring-1 ring-red-400';
                      badge = (
                        <span className="text-[10px] font-mono font-bold text-red-700 bg-red-200 px-1.5 py-0.5 rounded border border-red-400">
                          Your Choice (Wrong)
                        </span>
                      );
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-xl border flex items-center justify-between space-x-2 text-xs sm:text-sm ${optStyle}`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="font-mono font-bold text-xs opacity-75">
                            ({String.fromCharCode(65 + oIdx)})
                          </span>
                          <span>{opt}</span>
                        </div>
                        {badge}
                      </div>
                    );
                  })}
                </div>

                {/* Mathematical Proof & Explanation Box */}
                <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 space-y-1.5 text-xs text-red-800">
                  <div className="font-mono font-bold text-red-700 flex items-center space-x-1.5 uppercase text-[11px]">
                    <Sparkles className="h-3.5 w-3.5 text-red-600" />
                    <span>Worked Derivation & Mathematical Proof:</span>
                  </div>
                  <p className="font-mono text-red-800 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-red-200">
                    {q.explanation}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
