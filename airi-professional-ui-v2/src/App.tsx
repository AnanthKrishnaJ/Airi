import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UserDashboard } from './components/UserDashboard';
import { TopicExplorer } from './components/TopicExplorer';
import { ExamRunner } from './components/ExamRunner';
import { ExamResultView } from './components/ExamResultView';
import { AdminStudio } from './components/AdminStudio';
import { BookmarksView } from './components/BookmarksView';
import { QuestionBankBrowser } from './components/QuestionBankBrowser';
import { PossibleUIViewer, RedThemeVariant } from './components/PossibleUIViewer';
import { ExamAttempt, ExamResult } from './types/quiz';
import { startQuiz, fetchAttempt, fetchResult } from './services/api';
import {
  Award,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sparkles,
  LayoutDashboard,
  BookOpen,
  Bookmark,
  Database,
  ShieldCheck,
  MoreHorizontal,
  X,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeAttempt, setActiveAttempt] = useState<ExamAttempt | null>(null);
  const [currentResult, setCurrentResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [mobileMoreMenuOpen, setMobileMoreMenuOpen] = useState<boolean>(false);

  // Red theme variant state for White & Red UI design system
  const [redThemeVariant, setRedThemeVariant] = useState<RedThemeVariant>(() => {
    return (localStorage.getItem('aptimaster_red_style') as RedThemeVariant) || 'editorial';
  });

  const handleSelectThemeVariant = (variant: RedThemeVariant) => {
    setRedThemeVariant(variant);
    localStorage.setItem('aptimaster_red_style', variant);
    document.documentElement.setAttribute('data-red-theme', variant);
  };

  // Ensure theme is strictly locked to light mode (white background and red text)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('aptimaster_theme', 'light');
    document.documentElement.setAttribute('data-red-theme', redThemeVariant);
  }, [redThemeVariant]);

  // Refresh Recovery: check for ongoing attempt
  useEffect(() => {
    const savedAttemptId = localStorage.getItem('active_aptimaster_attempt');
    if (savedAttemptId) {
      fetchAttempt(savedAttemptId)
        .then(att => {
          if (!att.isSubmitted && att.remainingSeconds > 0) {
            setActiveAttempt(att);
            setCurrentTab('exam-runner');
          } else {
            localStorage.removeItem('active_aptimaster_attempt');
          }
        })
        .catch(() => {
          localStorage.removeItem('active_aptimaster_attempt');
        });
    }
  }, []);

  const handleStartExam = async (config: {
    title?: string;
    mode?: 'practice' | 'exam';
    category?: any;
    topicId?: string;
    difficulty?: any;
    count: number;
    durationMinutes: number;
  }) => {
    try {
      setLoading(true);
      const attempt = await startQuiz({
        title: config.title,
        mode: config.mode || 'exam',
        category: config.category,
        topicId: config.topicId,
        difficulty: config.difficulty,
        count: config.count,
        durationMinutes: config.durationMinutes
      });
      setActiveAttempt(attempt);
      setCurrentTab('exam-runner');
    } catch (err: any) {
      alert(`Could not start exam: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishExam = async (attemptId: string) => {
    try {
      setLoading(true);
      const result = await fetchResult(attemptId);
      setCurrentResult(result);
      setActiveAttempt(null);
      setCurrentTab('result');
    } catch (err: any) {
      alert(`Failed to load test results: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = async (attemptId: string) => {
    try {
      setLoading(true);
      const result = await fetchResult(attemptId);
      setCurrentResult(result);
      setCurrentTab('result');
    } catch (err: any) {
      alert(`Could not fetch result: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    if (activeAttempt && !confirm('You have an active exam in progress. Leave exam?')) {
      return;
    }
    setActiveAttempt(null);
    setCurrentTab(tab);
    setMobileMoreMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isExamActive = currentTab === 'exam-runner' && activeAttempt !== null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleTabChange}
        darkMode={false}
        onToggleDarkMode={() => {}}
        activeExamTitle={activeAttempt && currentTab === 'exam-runner' ? activeAttempt.title : null}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 md:pb-12">
        {loading && (
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            <span className="text-xs font-mono text-red-600 uppercase tracking-widest font-semibold">
              Airi Engine Loading...
            </span>
          </div>
        )}

        {!loading && currentTab === 'dashboard' && (
          <UserDashboard
            onStartExam={handleStartExam}
            onViewResult={handleViewResult}
            onSelectTab={handleTabChange}
          />
        )}

        {!loading && currentTab === 'topics' && (
          <TopicExplorer onStartExam={handleStartExam} />
        )}

        {/* Master Exam Showcase View - Vibrant White & Red Editorial Style */}
        {!loading && currentTab === 'master-exam' && (
          <div className="max-w-4xl mx-auto space-y-8 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="relative overflow-hidden rounded-2xl bg-white text-red-700 p-6 sm:p-9 shadow-md shadow-red-500/5 border border-red-200 space-y-4"
            >
              {/* Vibrant red top hairline */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-500 animate-gradient-flow" />

              <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-mono tracking-widest uppercase font-bold">
                <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse inline-block" />
                  <span>MADE BY ANANTH</span>
                </span>
                <span className="text-red-300">·</span>
                <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  AIRI BENCHMARK SIMULATION
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-red-700">
                Aptitude Master Benchmark Examination
              </h1>
              <p className="text-sm sm:text-base text-red-800/85 leading-relaxed max-w-2xl">
                Standard competitive examination simulation mirroring top entrance and recruitment tests (CAT, GATE, GRE, GMAT, Banking PO, TCS NQT) across all three core aptitude pillars.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-3">
                <div className="p-4 rounded-xl bg-white border border-red-200 text-center">
                  <div className="text-[10px] font-mono uppercase text-red-600 font-bold">Total MCQs</div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-red-700 mt-0.5">100</div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-red-200 text-center">
                  <div className="text-[10px] font-mono uppercase text-red-600 font-bold">Duration</div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-red-700 mt-0.5">100 Min</div>
                </div>
                <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 text-center">
                  <div className="text-[10px] font-mono uppercase text-red-700 font-bold">Correct Mark</div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-red-700 mt-0.5">+1.0</div>
                </div>
                <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 text-center">
                  <div className="text-[10px] font-mono uppercase text-red-700 font-bold">Wrong Deduction</div>
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-red-700 mt-0.5">-1.0</div>
                </div>
              </div>
            </motion.div>

            {/* Structure Breakdown */}
            <div className="bg-white rounded-2xl border border-red-200 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-red-600 font-bold">
                TEST SPECIFICATIONS
              </div>
              <h2 className="text-xl font-serif font-bold text-red-700">
                Exam Section Distribution
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-red-200 bg-white space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-red-600">Section I</div>
                  <div className="text-base font-serif font-bold text-red-700">Quantitative Aptitude</div>
                  <div className="text-xs text-red-800/80">40 Questions (Number System, Arithmetic, Algebra, Geometry)</div>
                </div>

                <div className="p-5 rounded-2xl border border-red-200 bg-white space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-red-600">Section II</div>
                  <div className="text-base font-serif font-bold text-red-700">Logical Reasoning</div>
                  <div className="text-xs text-red-800/80">35 Questions (Series, Syllogisms, Arrangements, Blood Relations)</div>
                </div>

                <div className="p-5 rounded-2xl border border-red-200 bg-white space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-red-600">Section III</div>
                  <div className="text-base font-serif font-bold text-red-700">Verbal Ability</div>
                  <div className="text-xs text-red-800/80">25 Questions (Grammar, Vocabulary, Reading, Para Jumbles)</div>
                </div>
              </div>
            </div>

            {/* Negative Marking Rules Card */}
            <div className="bg-white rounded-2xl border border-red-200 p-6 sm:p-7 shadow-xs space-y-3">
              <h3 className="text-base font-serif font-bold text-red-700 flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span>Negative Marking Rules & Examination Protocol</span>
              </h3>
              <ul className="text-xs sm:text-sm text-red-800/85 space-y-2 list-disc list-inside">
                <li><strong className="text-red-700 font-bold">Correct Answer:</strong> +1.0 mark is awarded for each correct answer.</li>
                <li><strong className="text-red-700 font-bold">Incorrect Answer:</strong> 1.0 mark is deducted (-1.0) for each wrong answer.</li>
                <li><strong className="text-red-700 font-bold">Unattempted Questions:</strong> 0 marks. No marks are deducted for unattempted questions.</li>
                <li><strong className="text-red-700 font-bold">Anti-Cheating Monitor:</strong> Switching tabs or minimizing the browser window will be logged as a violation.</li>
                <li><strong className="text-red-700 font-bold">Auto-Submission:</strong> The examination will automatically submit when the countdown reaches 00:00.</li>
              </ul>
            </div>

            {/* Launch Button - Vibrant Red Gradient */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                handleStartExam({
                  title: 'Airi Master Benchmark Test (100 Qs)',
                  mode: 'exam',
                  category: 'full',
                  count: 100,
                  durationMinutes: 100
                })
              }
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-base shadow-md shadow-red-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer border border-red-500/30"
            >
              <Play className="h-5 w-5 fill-white" />
              <span>Begin Master Exam (100 Questions · 100 Minutes)</span>
            </motion.button>
          </div>
        )}

        {!loading && currentTab === 'bookmarks' && (
          <BookmarksView onStartExam={handleStartExam} />
        )}

        {!loading && currentTab === 'possible-uis' && (
          <PossibleUIViewer
            currentThemeVariant={redThemeVariant}
            onSelectThemeVariant={handleSelectThemeVariant}
            onNavigateToTab={handleTabChange}
          />
        )}

        {!loading && currentTab === 'question-bank' && (
          <QuestionBankBrowser />
        )}

        {!loading && currentTab === 'admin' && (
          <AdminStudio />
        )}

        {!loading && currentTab === 'exam-runner' && activeAttempt && (
          <ExamRunner
            initialAttempt={activeAttempt}
            onFinishExam={handleFinishExam}
            onExitExam={() => {
              if (confirm('Are you sure you want to exit the exam without submitting?')) {
                localStorage.removeItem('active_aptimaster_attempt');
                setActiveAttempt(null);
                setCurrentTab('dashboard');
              }
            }}
          />
        )}

        {!loading && currentTab === 'result' && currentResult && (
          <ExamResultView
            result={currentResult}
            onRetake={() => {
              handleStartExam({
                title: currentResult.title,
                mode: currentResult.mode,
                count: currentResult.totalQuestions,
                durationMinutes: Math.round(currentResult.totalTimeSeconds / 60)
              });
            }}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        )}
      </main>

      {/* Optimized Mobile Bottom Navigation Bar with Red Indicators */}
      {!isExamActive && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-red-200 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(220,38,38,0.06)]">
          <div className="grid grid-cols-5 h-14">
            {[
              { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
              { id: 'topics', label: '62 Topics', icon: BookOpen },
              { id: 'master-exam', label: 'Master', icon: Award },
              { id: 'bookmarks', label: 'Saved', icon: Bookmark }
            ].map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex flex-col items-center justify-center space-y-1 transition-colors relative ${
                    isActive
                      ? 'text-red-700 font-bold'
                      : 'text-red-600/70 hover:text-red-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] tracking-tight">{item.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="mobile-nav-dot"
                      className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_6px_#dc2626]"
                    />
                  )}
                </button>
              );
            })}

            <button
              onClick={() => setMobileMoreMenuOpen(true)}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors relative ${
                ['question-bank', 'admin'].includes(currentTab)
                  ? 'text-red-700 font-bold'
                  : 'text-red-600/70 hover:text-red-700'
              }`}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="text-[10px] tracking-tight">More</span>
              {['question-bank', 'admin'].includes(currentTab) && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-red-600" />
              )}
            </button>
          </div>
        </nav>
      )}

      {/* Mobile More Sheet */}
      <AnimatePresence>
        {mobileMoreMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMoreMenuOpen(false)}
              className="absolute inset-0 bg-red-950/20 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative z-10 bg-white rounded-t-2xl border-t border-red-200 p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-red-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-red-600 uppercase font-semibold">
                    made by Ananth
                  </span>
                  <h3 className="text-lg font-serif font-bold text-red-700">
                    Airi Menu
                  </h3>
                </div>
                <button
                  onClick={() => setMobileMoreMenuOpen(false)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  onClick={() => handleTabChange('possible-uis')}
                  className="p-3.5 rounded-xl border border-red-200 bg-red-50/50 text-left flex items-center space-x-3 cursor-pointer hover:bg-red-50"
                >
                  <Palette className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-sm font-serif font-bold text-red-700 flex items-center space-x-2">
                      <span>Possible UIs & Themes</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-600 text-white font-bold">4 Styles</span>
                    </div>
                    <div className="text-xs text-red-600/80">Explore & apply 4 White & Red design variations</div>
                  </div>
                </button>

                <button
                  onClick={() => handleTabChange('question-bank')}
                  className="p-3.5 rounded-xl border border-red-200 bg-white text-left flex items-center space-x-3 cursor-pointer hover:bg-red-50"
                >
                  <Database className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-sm font-serif font-bold text-red-700">Question Bank Compendium</div>
                    <div className="text-xs text-red-600/80">Search and review 1,000+ MCQs with solutions</div>
                  </div>
                </button>

                <button
                  onClick={() => handleTabChange('admin')}
                  className="p-3.5 rounded-xl border border-red-200 bg-white text-left flex items-center space-x-3 cursor-pointer hover:bg-red-50"
                >
                  <ShieldCheck className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-sm font-serif font-bold text-red-700">Admin Studio & Generator</div>
                    <div className="text-xs text-red-600/80">AI MCQ generator, pending review, import/export</div>
                  </div>
                </button>
              </div>

              <div className="pt-2 text-center">
                <span className="text-[10px] font-mono text-red-600 uppercase">
                  Airi Platform · Competitive Exam Standard · made by Ananth
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
