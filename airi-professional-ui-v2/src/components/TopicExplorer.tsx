import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Zap,
  Play,
  CheckCircle,
  HelpCircle,
  Clock,
  Filter,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { TopicInfo, DifficultyLevel } from '../types/quiz';
import { fetchTopics } from '../services/api';

interface TopicExplorerProps {
  onStartExam: (config: {
    title: string;
    mode: 'practice' | 'exam';
    category?: any;
    topicId?: string;
    difficulty?: DifficultyLevel | 'mixed';
    count: number;
    durationMinutes: number;
  }) => void;
}

export const TopicExplorer: React.FC<TopicExplorerProps> = ({ onStartExam }) => {
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal configuration state
  const [modalTopic, setModalTopic] = useState<TopicInfo | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'mixed'>('mixed');
  const [quizMode, setQuizMode] = useState<'practice' | 'exam'>('exam');

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const data = await fetchTopics();
      setTopics(data.topics);
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTopics = topics.filter(t => {
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subtopics.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleLaunchModal = (topic: TopicInfo) => {
    setModalTopic(topic);
    setQuestionCount(20);
    setDifficulty('mixed');
    setQuizMode('exam');
  };

  const handleStartConfiguredQuiz = () => {
    if (!modalTopic) return;
    const duration = quizMode === 'exam' ? questionCount : questionCount * 1.5;
    onStartExam({
      title: `${modalTopic.name} - ${difficulty === 'mixed' ? 'Mixed' : difficulty} Drill`,
      mode: quizMode,
      category: modalTopic.category,
      topicId: modalTopic.id,
      difficulty,
      count: questionCount,
      durationMinutes: Math.round(duration)
    });
    setModalTopic(null);
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-16 bg-white text-red-700">
      {/* Editorial Header and Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-red-200 pb-5">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-red-600 font-bold flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            <span>MADE BY ANANTH · 62 TOPICS REPOSITORY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-red-700 flex items-center space-x-2 mt-1">
            <BookOpen className="h-6 w-6 text-red-600" />
            <span>Airi Syllabus Catalog</span>
          </h1>
          <p className="text-xs sm:text-sm text-red-800/80 mt-1">
            Over 1,000 algorithmic & verified questions per topic across Quant, Logical Reasoning, and Verbal modules
          </p>
        </div>

        {/* Search input - pure white with red text and border */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
          <input
            type="text"
            placeholder="Search topic or concept..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-red-200 bg-white text-red-700 placeholder:text-red-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition shadow-2xs"
          />
        </div>
      </div>

      {/* Category Tabs - White & Red Segmented Controls */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {[
          { id: 'all', label: 'All Topics', count: topics.length },
          { id: 'quantitative', label: 'Quant', count: topics.filter(t => t.category === 'quantitative').length },
          { id: 'logical', label: 'Reasoning', count: topics.filter(t => t.category === 'logical').length },
          { id: 'verbal', label: 'Verbal', count: topics.filter(t => t.category === 'verbal').length }
        ].map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer border ${
                isSelected
                  ? 'bg-red-600 text-white border-red-600 shadow-xs font-bold'
                  : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Topic Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredTopics.map((topic, idx) => {
          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.3) }}
              className="bg-white rounded-2xl border border-red-200 p-5 shadow-xs transition flex flex-col justify-between group hover:border-red-400"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded border border-red-200 bg-red-50 text-red-700">
                    {topic.category}
                  </span>
                  <span className="font-mono text-[11px] text-red-400">
                    #{String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-serif font-bold text-red-700 group-hover:text-red-800 transition-colors">
                    {topic.name}
                  </h3>
                  <p className="text-xs text-red-800/80 line-clamp-2 mt-1 leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                {/* Subtopic tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {topic.subtopics.slice(0, 3).map((sub, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-700 font-medium border border-red-100"
                    >
                      {sub}
                    </span>
                  ))}
                  {topic.subtopics.length > 3 && (
                    <span className="text-[10px] px-1 text-red-400 font-mono">+{topic.subtopics.length - 3}</span>
                  )}
                </div>
              </div>

              {/* Action Launch Bar */}
              <div className="pt-3.5 mt-4 border-t border-red-100 flex items-center justify-between">
                <div className="text-xs text-red-600">
                  <span className="font-mono font-bold text-red-700">{topic.totalQuestionsCount || 20}+</span> in bank
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLaunchModal(topic)}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer border border-red-500/30"
                >
                  <Play className="h-3 w-3 fill-white" />
                  <span>Practice</span>
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredTopics.length === 0 && (
        <div className="text-center py-16 text-red-400 font-serif">
          No topics matched your search "{searchQuery}".
        </div>
      )}

      {/* Quiz Configuration Modal */}
      {modalTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/20 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl border border-red-200 p-6 sm:p-7 shadow-2xl space-y-5 text-red-700">
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-600">SESSION SETUP</span>
                <h3 className="text-xl font-serif font-bold text-red-700 mt-0.5">{modalTopic.name}</h3>
              </div>
              <button
                onClick={() => setModalTopic(null)}
                className="text-red-400 hover:text-red-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mode: Practice vs Exam */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-red-700">Execution Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setQuizMode('exam')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    quizMode === 'exam'
                      ? 'border-red-600 bg-red-50 text-red-700 font-semibold ring-2 ring-red-500/30 shadow-xs'
                      : 'border-red-200 hover:bg-red-50 text-red-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center space-x-1.5">
                    <Clock className="h-3.5 w-3.5 text-red-600" />
                    <span>Exam Mode</span>
                  </div>
                  <div className="text-[11px] text-red-600/80 mt-1">
                    Strict timer, -1.0 negative marks, answers revealed on submit.
                  </div>
                </button>

                <button
                  onClick={() => setQuizMode('practice')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    quizMode === 'practice'
                      ? 'border-red-600 bg-red-50 text-red-700 font-semibold ring-2 ring-red-500/30 shadow-xs'
                      : 'border-red-200 hover:bg-red-50 text-red-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center space-x-1.5">
                    <Zap className="h-3.5 w-3.5 text-red-600" />
                    <span>Practice Mode</span>
                  </div>
                  <div className="text-[11px] text-red-600/80 mt-1">
                    Instant step-by-step solution verification, flexible timer.
                  </div>
                </button>
              </div>
            </div>

            {/* Question count selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-red-700">Number of Questions</label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 50, 100].map(count => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`min-h-[42px] py-2 rounded-xl text-xs font-mono font-bold border cursor-pointer transition ${
                      questionCount === count
                        ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-600 shadow-xs scale-[1.02]'
                        : 'border-red-200 text-red-700 hover:bg-red-50'
                    }`}
                  >
                    {count} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-red-700">Difficulty Level</label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['mixed', 'Easy', 'Medium', 'Hard', 'Expert'] as const).map(diff => {
                  const isSelected = difficulty === diff;
                  return (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`min-h-[40px] py-2 rounded-xl text-[11px] font-bold border capitalize cursor-pointer transition ${
                        isSelected
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'border-red-200 text-red-700 hover:bg-red-50'
                      }`}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary preview */}
            <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-200 text-xs space-y-1 text-red-700">
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-semibold text-red-700">
                  {quizMode === 'exam' ? `${questionCount} Minutes` : 'Untimed / Flexible'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Negative Marking:</span>
                <span className="font-semibold text-red-700">
                  +1.0 Correct / -1.0 Wrong / 0 Unattempted
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setModalTopic(null)}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartConfiguredQuiz}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs shadow-md shadow-red-600/25 transition cursor-pointer border border-red-500/30"
              >
                Launch Test Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
