import React, { useState, useEffect } from 'react';
import {
  Award,
  TrendingUp,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Bookmark,
  ArrowRight,
  BookOpen,
  Zap,
  BarChart3,
  Calendar,
  Sparkles,
  ChevronRight,
  Flame,
  Check,
  Palette
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserStats, DifficultyLevel } from '../types/quiz';
import { fetchUserStats } from '../services/api';

interface UserDashboardProps {
  onStartExam: (config: {
    title: string;
    mode: 'practice' | 'exam';
    category?: any;
    topicId?: string;
    difficulty?: any;
    count: number;
    durationMinutes: number;
  }) => void;
  onViewResult: (attemptId: string) => void;
  onSelectTab: (tab: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onStartExam,
  onViewResult,
  onSelectTab
}) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fetchUserStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load user stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalAttempted = stats?.totalQuestionsAttempted || 0;
  const overallReadiness = Math.min(100, Math.round((totalAttempted / 200) * 100));

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 sm:pb-16 bg-white text-red-700">
      {/* Dynamic Editorial Hero Masthead */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-white text-red-700 p-6 sm:p-9 shadow-md shadow-red-500/5 border border-red-200"
      >
        {/* Animated vibrant gradient top hairline */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-500 animate-gradient-flow" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-mono tracking-widest uppercase font-bold">
            <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center space-x-1.5 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-ping inline-block" />
              <span>MADE BY ANANTH</span>
            </span>
            <span className="text-red-300">·</span>
            <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              AIRI BENCHMARK
            </span>
            <span className="text-red-300">·</span>
            <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              62 TOPICS
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-red-700 leading-[1.15]">
            Competitive Aptitude <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-red-700">Mastery Platform</span>
          </h1>

          <p className="text-sm sm:text-base text-red-800/85 max-w-2xl leading-relaxed">
            Engineered by Ananth for high-stakes entrance exams (CAT, GATE, GRE, GMAT, Banking PO, TCS NQT). Rigorous negative marking (<span className="text-red-700 font-mono font-bold">+1.0</span> / <span className="text-red-700 font-mono font-bold">-1.0</span>) with verified worked calculations.
          </p>

          {/* Overall Exam Readiness Animated Progress Bar */}
          <div className="pt-2 p-4 rounded-xl bg-red-50/50 border border-red-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-red-700 flex items-center space-x-1.5">
                <Sparkles className="h-4 w-4 text-red-600 animate-spin-slow" />
                <span>Overall Benchmark Readiness Meter</span>
              </span>
              <span className="font-mono font-bold text-red-700 text-sm">
                {overallReadiness}%
              </span>
            </div>

            <div className="relative w-full h-3 bg-red-100 rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(6, overallReadiness)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="relative h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-500 rounded-full overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </motion.div>
            </div>

            <div className="flex justify-between text-[11px] font-mono text-red-600">
              <span>{totalAttempted} Questions Mastered</span>
              <span>Target: 200 Questions (Master Tier)</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                onStartExam({
                  title: 'Airi Master Benchmark Exam (100 Qs)',
                  mode: 'exam',
                  category: 'full',
                  count: 100,
                  durationMinutes: 100
                })
              }
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-semibold text-xs sm:text-sm shadow-md shadow-red-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer border border-red-500/30"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Launch Master Exam (100 Qs · 100 Min)</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectTab('topics')}
              className="px-5 py-3.5 rounded-xl bg-white hover:bg-red-50 text-red-700 font-semibold text-xs sm:text-sm border border-red-200 transition-all flex items-center justify-center space-x-2 cursor-pointer hover:border-red-400"
            >
              <BookOpen className="h-4 w-4 text-red-600" />
              <span>Explore 62 Topics</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectTab('possible-uis')}
              className="px-5 py-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs sm:text-sm border border-red-300 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
            >
              <Palette className="h-4 w-4 text-red-600" />
              <span>Possible UIs (4 Styles)</span>
            </motion.button>
          </div>
        </div>

        {/* Minimalist decorative background glyph */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden lg:flex items-center justify-center text-red-600">
          <Award className="w-80 h-80 -mr-16" />
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Metric 1: Tests Completed */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-red-200 shadow-xs hover:border-red-400 transition relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-red-600 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-red-600">
              Tests Completed
            </span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-serif font-bold text-red-700">
            {stats?.totalTestsCompleted ?? 0}
          </div>
          <div className="flex items-center space-x-1.5 mt-2">
            <span className="text-[11px] font-mono text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-100">
              {stats?.totalQuestionsAttempted ?? 0} solved
            </span>
          </div>
        </motion.div>

        {/* Metric 2: Average Score */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-red-200 shadow-xs hover:border-red-400 transition relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-red-600 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-red-600">
              Average Score
            </span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-serif font-bold text-red-700">
            {stats?.averageScore ?? 0}
          </div>
          <div className="flex items-center space-x-1.5 mt-2">
            <span className="text-[11px] font-mono text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-100">
              Best: {stats?.bestScore ?? 0} pts
            </span>
          </div>
        </motion.div>

        {/* Metric 3: Accuracy Rate */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-red-200 shadow-xs hover:border-red-400 transition relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-red-600 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-red-600">
              Accuracy Rate
            </span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-serif font-bold text-red-700">
            {stats?.averageAccuracy ?? 0}%
          </div>
          <div className="flex items-center space-x-1.5 mt-2">
            <span className="text-[11px] font-mono text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-100">
              Target: 80%+
            </span>
          </div>
        </motion.div>

        {/* Metric 4: Active Study Time */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-red-200 shadow-xs hover:border-red-400 transition relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-red-600 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-red-600">
              Study Time
            </span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-serif font-bold text-red-700">
            {stats?.totalTimeSpentMinutes ?? 0}m
          </div>
          <div className="flex items-center space-x-1.5 mt-2">
            <span className="text-[11px] font-mono text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-100">
              Timed drills
            </span>
          </div>
        </motion.div>
      </div>

      {/* Category Progress - Core Aptitude Pillars */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="bg-white rounded-2xl border border-red-200 p-5 sm:p-7 shadow-xs space-y-6"
      >
        <div className="flex items-center justify-between border-b border-red-100 pb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-red-600 font-bold">
              DOMAINS & SYLLABUS CALIBRATION
            </div>
            <h2 className="text-xl font-serif font-bold text-red-700 flex items-center space-x-2 mt-0.5">
              <BarChart3 className="h-5 w-5 text-red-600" />
              <span>Core Aptitude Pillars</span>
            </h2>
            <p className="text-xs text-red-800/80 mt-0.5">
              Track your solved volume and accuracy across Quantitative, Logical, and Verbal reasoning
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Pillar 1: Quantitative */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-red-200 space-y-3 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-red-700">Quantitative Aptitude</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                26 Topics
              </span>
            </div>
            <div className="text-xs text-red-600">
              Bank volume: <span className="font-mono font-bold">{stats?.categoryProgress.quantitative.questionsBankCount ?? 0}+ MCQs</span>
            </div>

            {/* Glowing animated progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-red-100 h-3 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(8, (stats?.categoryProgress.quantitative.attempted || 0) * 4))}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-red-600 to-rose-500 h-full rounded-full relative overflow-hidden shadow-sm"
                >
                  <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                </motion.div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-red-700 pt-1">
              <span className="font-mono font-semibold">{stats?.categoryProgress.quantitative.attempted ?? 0} solved</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  onStartExam({
                    title: 'Quantitative Speed Drill (20 Qs)',
                    mode: 'exam',
                    category: 'quantitative',
                    count: 20,
                    durationMinutes: 20
                  })
                }
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
              >
                <span>Drill</span>
                <ChevronRight className="h-3 w-3" />
              </motion.button>
            </div>
          </div>

          {/* Pillar 2: Logical Reasoning */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-red-200 space-y-3 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-red-700">Logical Reasoning</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                22 Topics
              </span>
            </div>
            <div className="text-xs text-red-600">
              Bank volume: <span className="font-mono font-bold">{stats?.categoryProgress.logical.questionsBankCount ?? 0}+ MCQs</span>
            </div>

            {/* Glowing animated progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-red-100 h-3 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(8, (stats?.categoryProgress.logical.attempted || 0) * 4))}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  className="bg-gradient-to-r from-red-600 to-rose-600 h-full rounded-full relative overflow-hidden shadow-sm"
                >
                  <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                </motion.div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-red-700 pt-1">
              <span className="font-mono font-semibold">{stats?.categoryProgress.logical.attempted ?? 0} solved</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  onStartExam({
                    title: 'Logical Reasoning Drill (20 Qs)',
                    mode: 'exam',
                    category: 'logical',
                    count: 20,
                    durationMinutes: 20
                  })
                }
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
              >
                <span>Drill</span>
                <ChevronRight className="h-3 w-3" />
              </motion.button>
            </div>
          </div>

          {/* Pillar 3: Verbal Ability */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-red-200 space-y-3 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-red-700">Verbal Ability</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                14 Topics
              </span>
            </div>
            <div className="text-xs text-red-600">
              Bank volume: <span className="font-mono font-bold">{stats?.categoryProgress.verbal.questionsBankCount ?? 0}+ MCQs</span>
            </div>

            {/* Glowing animated progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-red-100 h-3 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(8, (stats?.categoryProgress.verbal.attempted || 0) * 4))}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  className="bg-gradient-to-r from-red-600 to-rose-600 h-full rounded-full relative overflow-hidden shadow-sm"
                >
                  <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                </motion.div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-red-700 pt-1">
              <span className="font-mono font-semibold">{stats?.categoryProgress.verbal.attempted ?? 0} solved</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  onStartExam({
                    title: 'Verbal Ability Drill (20 Qs)',
                    mode: 'exam',
                    category: 'verbal',
                    count: 20,
                    durationMinutes: 20
                  })
                }
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
              >
                <span>Drill</span>
                <ChevronRight className="h-3 w-3" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Difficulty Tiers Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white rounded-2xl border border-red-200 p-5 sm:p-7 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-red-100 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-red-600 font-bold flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
              <span>DIFFICULTY CALIBRATION</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-red-700 flex items-center space-x-2 mt-0.5">
              <Target className="h-5 w-5 text-red-600" />
              <span>Performance by Difficulty Tier</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {(['Easy', 'Medium', 'Hard', 'Expert'] as const).map(diff => {
            const diffData = stats?.difficultyProgress ? stats.difficultyProgress[diff] : { attempted: 0, correct: 0, wrong: 0, accuracy: 0 };
            return (
              <div
                key={diff}
                className="p-4 rounded-xl bg-white border border-red-200 space-y-2.5 transition-all hover:border-red-400"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase text-red-700">
                    {diff} Tier
                  </span>
                  <span className="text-xs font-mono font-bold text-red-700">
                    {diffData.accuracy}%
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-red-600/80 font-mono">
                    <span>{diffData.attempted} done</span>
                    <span>{diffData.correct} correct</span>
                  </div>
                  <div className="w-full bg-red-100 h-2 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(diffData.attempted > 0 ? 8 : 0, diffData.accuracy))}%` }}
                      transition={{ duration: 0.6 }}
                      className="bg-gradient-to-r from-red-600 to-rose-600 h-full rounded-full"
                    />
                  </div>
                </div>

                <button
                  onClick={() =>
                    onStartExam({
                      title: `${diff} Difficulty Drill`,
                      mode: 'exam',
                      difficulty: diff,
                      count: 20,
                      durationMinutes: 20
                    })
                  }
                  className="w-full py-2 rounded-lg bg-white border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 transition cursor-pointer shadow-2xs"
                >
                  Practice {diff} →
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 sm:p-6 rounded-2xl border border-red-200 space-y-3 shadow-xs hover:border-red-400 transition"
        >
          <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shadow-2xs">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold font-serif text-lg text-red-700">Topic Practice</h3>
            <p className="text-xs text-red-800/80 mt-1">
              Select any of 62 topics with custom question count (10 to 100) and difficulty level.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('topics')}
            className="w-full py-2.5 rounded-xl bg-red-50 text-red-700 font-bold text-xs border border-red-200 hover:bg-red-100 transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Browse 62 Topics</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 sm:p-6 rounded-2xl border border-red-200 space-y-3 shadow-xs hover:border-red-400 transition"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-md shadow-red-600/20">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold font-serif text-lg text-red-700">Full Aptitude Master Exam</h3>
            <p className="text-xs text-red-800/80 mt-1">
              100 Questions covering Quant, Reasoning, and Verbal with strict negative marking (+1 / -1).
            </p>
          </div>
          <button
            onClick={() =>
              onStartExam({
                title: 'Airi Master Benchmark Exam',
                mode: 'exam',
                category: 'full',
                count: 100,
                durationMinutes: 100
              })
            }
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs shadow-md shadow-red-600/20 transition flex items-center justify-center space-x-1.5 cursor-pointer border border-red-500/30"
          >
            <span>Start 100-Question Exam</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-5 sm:p-6 rounded-2xl border border-red-200 space-y-3 shadow-xs hover:border-red-400 transition"
        >
          <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shadow-2xs">
            <Bookmark className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold font-serif text-lg text-red-700">Flagged Difficult Questions</h3>
            <p className="text-xs text-red-800/80 mt-1">
              Practice questions you bookmarked during exams to reinforce weak spots.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('bookmarks')}
            className="w-full py-2.5 rounded-xl bg-red-50 text-red-700 font-bold text-xs border border-red-200 hover:bg-red-100 transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>View Bookmarks</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      </div>

      {/* Recent Test History */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="bg-white rounded-2xl border border-red-200 p-5 sm:p-7 shadow-xs"
      >
        <div className="flex items-center justify-between mb-4 border-b border-red-100 pb-3">
          <h2 className="text-lg font-serif font-bold text-red-700 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-red-600" />
            <span>Candidate Test Scorecards</span>
          </h2>
        </div>

        {stats?.recentAttempts && stats.recentAttempts.length > 0 ? (
          <div className="divide-y divide-red-100">
            {stats.recentAttempts.map(att => (
              <div key={att.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-red-50/50 px-3 rounded-xl transition">
                <div>
                  <div className="text-sm font-bold text-red-700 font-serif">{att.title}</div>
                  <div className="text-xs text-red-600/70 font-mono mt-0.5">
                    {new Date(att.date).toLocaleDateString()} · {new Date(att.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-red-700">
                      {att.score} / {att.maxScore}
                    </div>
                    <div className="text-xs text-red-600/80 font-mono">
                      Accuracy: <span className="font-semibold text-red-700">{att.accuracy}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onViewResult(att.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs border border-red-500/30"
                  >
                    View Analysis
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-red-600/70 text-xs font-serif">
            No completed tests yet. Start your first session or launch the Master Exam above!
          </div>
        )}
      </motion.div>
    </div>
  );
};
