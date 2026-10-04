import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Maximize2,
  Minimize2,
  Send,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  PanelRightClose,
  PanelRightOpen,
  Eye,
  Check,
  X,
  Zap,
  Grid,
  ListFilter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExamAttempt, ClientExamQuestion, UserAnswerState, QuestionStatus } from '../types/quiz';
import { saveAttemptAnswer, recordViolation, submitQuizAttempt, toggleBookmark } from '../services/api';

interface ExamRunnerProps {
  initialAttempt: ExamAttempt;
  onFinishExam: (attemptId: string) => void;
  onExitExam: () => void;
}

export const ExamRunner: React.FC<ExamRunnerProps> = ({
  initialAttempt,
  onFinishExam,
  onExitExam
}) => {
  const [attempt, setAttempt] = useState<ExamAttempt>(initialAttempt);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswerState>>(initialAttempt.answers);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialAttempt.remainingSeconds);
  const [paletteOpen, setPaletteOpen] = useState<boolean>(true);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showMarkedQuestionsModal, setShowMarkedQuestionsModal] = useState<boolean>(false);
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'marked' | 'unanswered'>('all');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [violationToast, setViolationToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timerWarning, setTimerWarning] = useState<string | null>(null);
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('all');

  // Practice mode state: allows instant feedback on current question
  const [practiceChecked, setPracticeChecked] = useState<boolean>(false);
  const [practiceFeedback, setPracticeFeedback] = useState<{ isCorrect: boolean; correctOption: number; explanation: string } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questions = attempt.questions;
  const currentQ: ClientExamQuestion | undefined = questions[currentIndex];

  // Store active attempt ID in localStorage for refresh recovery
  useEffect(() => {
    localStorage.setItem('active_aptimaster_attempt', attempt.id);
    return () => {};
  }, [attempt.id]);

  // Mark current question as visited on load or index change
  useEffect(() => {
    if (!currentQ) return;
    const currentAns = answers[currentQ.id];
    if (!currentAns || !currentAns.visited) {
      const updatedAns: UserAnswerState = {
        questionId: currentQ.id,
        selectedOption: currentAns?.selectedOption ?? null,
        isMarkedForReview: currentAns?.isMarkedForReview ?? false,
        timeSpentSeconds: currentAns?.timeSpentSeconds ?? 0,
        visited: true
      };
      setAnswers(prev => ({ ...prev, [currentQ.id]: updatedAns }));
      saveAttemptAnswer(attempt.id, {
        questionId: currentQ.id,
        selectedOption: updatedAns.selectedOption,
        visited: true
      }).catch(console.error);
    }
    setPracticeChecked(false);
    setPracticeFeedback(null);
  }, [currentIndex, currentQ?.id]);

  // ================= TIMER ENGINE =================
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }

        // Timer warnings at critical milestones
        if (prev === 300) {
          setTimerWarning('⚠️ 5 Minutes Remaining! Review your answers.');
          setTimeout(() => setTimerWarning(null), 7000);
        } else if (prev === 60) {
          setTimerWarning('🚨 1 Minute Remaining! Exam will auto-submit at 0:00.');
          setTimeout(() => setTimerWarning(null), 7000);
        } else if (prev === 30) {
          setTimerWarning('⏱️ 30 Seconds Left!');
          setTimeout(() => setTimerWarning(null), 5000);
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Periodic autosave of time remaining
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (currentQ) {
        saveAttemptAnswer(attempt.id, {
          questionId: currentQ.id,
          selectedOption: answers[currentQ.id]?.selectedOption ?? null,
          timeSpentSeconds: (answers[currentQ.id]?.timeSpentSeconds || 0) + 10
        }).catch(console.error);
      }
    }, 10000);
    return () => clearInterval(autoSaveInterval);
  }, [currentQ, answers, attempt.id]);

  // ================= ANTI-CHEATING TAB SWITCH DETECTION =================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation(attempt.id)
          .then(count => {
            setViolationToast(`Notice: Focus returned. Tab switches recorded: ${count}`);
            setTimeout(() => setViolationToast(null), 5000);
          })
          .catch(console.error);
      }
    };

    const handleWindowBlur = () => {
      if (document.hasFocus && !document.hasFocus()) {
        recordViolation(attempt.id)
          .then(count => {
            setViolationToast(`Notice: Stay focused on Airi. Tab switches: ${count}`);
            setTimeout(() => setViolationToast(null), 5000);
          })
          .catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [attempt.id]);

  // Fullscreen support
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') {
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        handleSelectOption(parseInt(e.key) - 1);
      } else if (['a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'].includes(e.key)) {
        const opt = e.key.toUpperCase().charCodeAt(0) - 65;
        if (opt >= 0 && opt < 4) handleSelectOption(opt);
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMarkForReview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions.length, currentQ]);

  // ================= ANSWER HANDLING =================
  const handleSelectOption = (optionIndex: number) => {
    if (!currentQ) return;
    const prevAns = answers[currentQ.id];
    const newOption = prevAns?.selectedOption === optionIndex ? null : optionIndex;

    const updatedAns: UserAnswerState = {
      questionId: currentQ.id,
      selectedOption: newOption,
      isMarkedForReview: prevAns?.isMarkedForReview ?? false,
      timeSpentSeconds: prevAns?.timeSpentSeconds ?? 0,
      visited: true
    };

    setAnswers(prev => ({ ...prev, [currentQ.id]: updatedAns }));
    saveAttemptAnswer(attempt.id, {
      questionId: currentQ.id,
      selectedOption: newOption,
      visited: true
    }).catch(console.error);

    setPracticeChecked(false);
    setPracticeFeedback(null);
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    const prevAns = answers[currentQ.id];
    const updatedAns: UserAnswerState = {
      questionId: currentQ.id,
      selectedOption: null,
      isMarkedForReview: prevAns?.isMarkedForReview ?? false,
      timeSpentSeconds: prevAns?.timeSpentSeconds ?? 0,
      visited: true
    };
    setAnswers(prev => ({ ...prev, [currentQ.id]: updatedAns }));
    saveAttemptAnswer(attempt.id, {
      questionId: currentQ.id,
      selectedOption: null,
      visited: true
    }).catch(console.error);
    setPracticeChecked(false);
    setPracticeFeedback(null);
  };

  const handleToggleMarkForReview = () => {
    if (!currentQ) return;
    const prevAns = answers[currentQ.id];
    const newMarked = !prevAns?.isMarkedForReview;
    const updatedAns: UserAnswerState = {
      questionId: currentQ.id,
      selectedOption: prevAns?.selectedOption ?? null,
      isMarkedForReview: newMarked,
      timeSpentSeconds: prevAns?.timeSpentSeconds ?? 0,
      visited: true
    };
    setAnswers(prev => ({ ...prev, [currentQ.id]: updatedAns }));
    saveAttemptAnswer(attempt.id, {
      questionId: currentQ.id,
      selectedOption: prevAns?.selectedOption ?? null,
      isMarkedForReview: newMarked
    }).catch(console.error);

    // Auto advance to next question on mark
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Jump to next marked question individually
  const handleJumpNextMarked = () => {
    for (let i = currentIndex + 1; i < questions.length; i++) {
      if (answers[questions[i].id]?.isMarkedForReview) {
        setCurrentIndex(i);
        return;
      }
    }
    for (let i = 0; i <= currentIndex; i++) {
      if (answers[questions[i].id]?.isMarkedForReview) {
        setCurrentIndex(i);
        return;
      }
    }
  };

  // Jump to previous marked question individually
  const handleJumpPrevMarked = () => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (answers[questions[i].id]?.isMarkedForReview) {
        setCurrentIndex(i);
        return;
      }
    }
    for (let i = questions.length - 1; i >= currentIndex; i--) {
      if (answers[questions[i].id]?.isMarkedForReview) {
        setCurrentIndex(i);
        return;
      }
    }
  };

  // Practice mode: fetch instant explanation from server without submitting exam
  const handleCheckAnswerPractice = async () => {
    if (!currentQ) return;
    try {
      const res = await fetch(`/api/questions/${currentQ.id}`);
      const fullQ = await res.json();
      const userSel = answers[currentQ.id]?.selectedOption;
      setPracticeFeedback({
        isCorrect: userSel === fullQ.correctOption,
        correctOption: fullQ.correctOption,
        explanation: fullQ.explanation
      });
      setPracticeChecked(true);
    } catch (err) {
      console.error('Failed to get explanation:', err);
    }
  };

  // ================= SUBMISSION =================
  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitQuizAttempt(attempt.id);
      localStorage.removeItem('active_aptimaster_attempt');
      onFinishExam(attempt.id);
    } catch (err) {
      console.error('Auto-submission error:', err);
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitQuizAttempt(attempt.id);
      localStorage.removeItem('active_aptimaster_attempt');
      onFinishExam(attempt.id);
    } catch (err) {
      console.error('Submission error:', err);
      setIsSubmitting(false);
      alert('Failed to submit exam. Please try again.');
    }
  };

  // ================= QUESTION STATUS COMPUTATION =================
  const getQuestionStatus = (qId: string, index: number): QuestionStatus => {
    const ans = answers[qId];
    if (index === currentIndex) return 'not_answered';
    if (!ans || !ans.visited) return 'not_visited';
    if (ans.isMarkedForReview && ans.selectedOption !== null) return 'answered_marked_for_review';
    if (ans.isMarkedForReview) return 'marked_for_review';
    if (ans.selectedOption !== null) return 'answered';
    return 'not_answered';
  };

  // Summary counts
  const answeredCount = Object.values(answers).filter(a => a.selectedOption !== null).length;
  const markedReviewCount = Object.values(answers).filter(a => a.isMarkedForReview).length;
  const notAnsweredVisitedCount = Object.values(answers).filter(a => a.visited && a.selectedOption === null).length;
  const notVisitedCount = questions.length - Object.values(answers).filter(a => a.visited).length;

  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  // Filtered questions in palette by section and status
  const filteredPaletteQuestions = questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q }) => {
      const matchesSection = activeSectionFilter === 'all' || q.category === activeSectionFilter;
      const ans = answers[q.id];
      if (paletteFilter === 'marked') {
        return matchesSection && !!ans?.isMarkedForReview;
      }
      if (paletteFilter === 'unanswered') {
        return matchesSection && (ans?.selectedOption === null || ans?.selectedOption === undefined);
      }
      return matchesSection;
    });

  // Format countdown
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white text-red-700 flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -my-6 sm:-my-8">
      {/* Violation Alert Toast */}
      {violationToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white text-red-700 px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm font-bold animate-bounce border-2 border-red-500">
          <ShieldAlert className="h-5 w-5 text-red-600" />
          <span>{violationToast}</span>
        </div>
      )}

      {/* Timer Warning Banner */}
      {timerWarning && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-white text-red-700 px-6 py-2.5 rounded-full shadow-lg flex items-center space-x-2 text-xs sm:text-sm font-bold animate-pulse border-2 border-red-500">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span>{timerWarning}</span>
        </div>
      )}

      {/* Top Exam Header with Live Progress Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-red-200 shadow-2xs px-3 sm:px-6 py-2.5 sm:py-3 transition-colors text-red-700">
        {/* Animated Progress Indicator across top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-100 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-500 relative"
            animate={{ width: `${progressPercent}%` }}
            transition={{ ease: 'easeOut', duration: 0.4 }}
          >
            <div className="absolute inset-0 bg-white/30 animate-shimmer" />
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_8px_#dc2626]" />
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Quiz Title & Candidate Progress */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-red-400/40 shadow-xs">
              <span className="font-serif italic font-bold">A</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono tracking-widest text-red-600 uppercase font-bold hidden sm:inline">
                  made by Ananth
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                  {attempt.mode === 'practice' ? 'Practice' : 'Exam'}
                </span>
              </div>
              <h1 className="text-xs sm:text-base font-serif font-bold text-red-700 truncate">
                {attempt.title}
              </h1>
            </div>
          </div>

          {/* Live Mobile Progress Pills & Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Answered Counter Pill */}
            <div className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-xs font-mono font-bold text-red-700 shadow-2xs">
              <span>{answeredCount}</span>
              <span className="text-red-500">/{questions.length}</span>
              <span className="text-red-600 hidden sm:inline ml-1">({progressPercent}%)</span>
            </div>

            {/* Live Countdown Display */}
            <div
              className={`px-3 py-1 sm:py-1.5 rounded-lg border flex items-center space-x-1.5 font-mono font-bold text-xs sm:text-sm ${
                remainingSeconds < 300
                  ? 'bg-red-100 border-red-400 text-red-700 animate-pulse'
                  : 'bg-white border-red-200 text-red-700'
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-red-600" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>

            {/* Mobile Question Palette Drawer Trigger */}
            <button
              onClick={() => setMobilePaletteOpen(!mobilePaletteOpen)}
              className="lg:hidden p-2 rounded-lg text-red-700 bg-white border border-red-200 flex items-center space-x-1 text-xs font-semibold cursor-pointer hover:bg-red-50"
              title="Open Question Palette"
            >
              <Grid className="h-4 w-4" />
              <span className="hidden xs:inline">Palette</span>
            </button>

            {/* Desktop Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-red-700 bg-white hover:bg-red-50 transition cursor-pointer hidden sm:block border border-red-200"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Desktop Toggle Palette */}
            <button
              onClick={() => setPaletteOpen(!paletteOpen)}
              className="p-2 rounded-lg text-red-700 bg-white hover:bg-red-50 transition cursor-pointer hidden lg:block border border-red-200"
              title="Toggle Question Palette"
            >
              {paletteOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </button>

            {/* Submit Test Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition flex items-center space-x-1.5 active:scale-95 cursor-pointer border border-red-500/30"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Submit Test</span>
              <span className="sm:hidden">Submit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start pb-24 sm:pb-8">
        {/* Left / Center Area: Question Viewer & Actions */}
        <div className={`space-y-4 ${paletteOpen ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all`}>
          {currentQ && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-red-200 shadow-xs p-5 sm:p-8 space-y-5 sm:space-y-6 text-red-700"
              >
                {/* Question Meta Bar & In-Card Animated Progress */}
                <div className="space-y-3 border-b border-red-100 pb-3 sm:pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold font-mono text-xs shadow-xs">
                        Q {currentIndex + 1}
                      </span>
                      <span className="text-xs text-red-600/80 font-mono">
                        of {questions.length}
                      </span>
                      <span className="text-red-300">·</span>
                      <span className="text-xs font-semibold text-red-700">
                        {currentQ.topicName}
                      </span>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 font-bold">
                        {currentQ.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold border border-red-200">+1.0</span>
                      <span className="text-red-300">/</span>
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold border border-red-200">-1.0</span>
                    </div>
                  </div>

                  {/* Animated In-Card Progress Bar (Red/Ruby) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-red-600">
                      <span className="flex items-center space-x-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping inline-block" />
                        <span className="font-semibold text-red-700">Exam Progress</span>
                      </span>
                      <span className="font-bold text-red-700">
                        {answeredCount}/{questions.length} answered ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-red-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-red-200 shadow-inner">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-red-500 progress-striped relative"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ type: 'spring', damping: 22, stiffness: 140 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-base sm:text-xl font-serif font-medium text-red-800 leading-relaxed whitespace-pre-wrap select-text">
                  {currentQ.questionText}
                </div>

                {/* 4 Large Selectable Options (A, B, C, D) */}
                <div className="space-y-2.5 sm:space-y-3 pt-1">
                  {currentQ.options.map((optionText, optIndex) => {
                    const letter = String.fromCharCode(65 + optIndex);
                    const isSelected = answers[currentQ.id]?.selectedOption === optIndex;

                    let borderClass = 'border-red-200 hover:border-red-400';
                    let bgClass = 'bg-white hover:bg-red-50/50 text-red-800';
                    let letterBg = 'bg-red-50 text-red-700 border border-red-200';

                    if (isSelected) {
                      borderClass = 'border-red-600 ring-2 ring-red-500/25 shadow-md shadow-red-500/10';
                      bgClass = 'bg-red-50 text-red-800 font-bold';
                      letterBg = 'bg-gradient-to-br from-red-600 to-rose-700 text-white border-red-600 font-bold shadow-xs';
                    }

                    // Practice mode feedback if checked
                    if (practiceChecked && practiceFeedback) {
                      if (optIndex === practiceFeedback.correctOption) {
                        borderClass = 'border-red-600 ring-2 ring-red-500/30 bg-red-100/70 text-red-900 font-bold';
                        bgClass = 'bg-red-100/70 text-red-900 font-bold';
                        letterBg = 'bg-red-600 text-white border-red-600';
                      } else if (isSelected && !practiceFeedback.isCorrect) {
                        borderClass = 'border-red-400 ring-1 ring-red-300 bg-red-50 text-red-800';
                        bgClass = 'bg-red-50 text-red-800';
                        letterBg = 'bg-red-400 text-white border-red-400';
                      }
                    }

                    return (
                      <motion.div
                        key={optIndex}
                        whileTap={{ scale: 0.995 }}
                        whileHover={{ scale: 1.005 }}
                        onClick={() => handleSelectOption(optIndex)}
                        className={`min-h-[52px] p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-center space-x-3.5 select-none ${borderClass} ${bgClass}`}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs sm:text-sm shrink-0 transition-colors ${letterBg}`}>
                          {letter}
                        </div>
                        <div className="flex-1 text-sm sm:text-base leading-snug">
                          {optionText}
                        </div>
                        {isSelected && !practiceChecked && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </motion.div>
                        )}
                        {practiceChecked && practiceFeedback && optIndex === practiceFeedback.correctOption && (
                          <div className="h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        )}
                        {practiceChecked && practiceFeedback && isSelected && !practiceFeedback.isCorrect && (
                          <div className="h-6 w-6 rounded-full bg-red-400 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <X className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Practice Mode Solution Panel */}
                {attempt.mode === 'practice' && (
                  <div className="pt-3 border-t border-red-100 space-y-3">
                    {!practiceChecked ? (
                      <button
                        onClick={handleCheckAnswerPractice}
                        disabled={answers[currentQ.id]?.selectedOption === null}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs shadow-md shadow-red-600/20 transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5 border border-red-500/30"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Check Answer & Step-by-Step Proof</span>
                      </button>
                    ) : (
                      practiceFeedback && (
                        <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 space-y-2.5 animate-in fade-in">
                          <div className="flex items-center space-x-2">
                            {practiceFeedback.isCorrect ? (
                              <span className="flex items-center space-x-1 text-red-700 font-bold text-sm">
                                <CheckCircle2 className="h-4 w-4 text-red-600" />
                                <span>Correct (+1.0 Mark)</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-1 text-red-700 font-bold text-sm">
                                <X className="h-4 w-4 text-red-600" />
                                <span>Incorrect — Correct option is ({String.fromCharCode(65 + practiceFeedback.correctOption)})</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-red-800 font-mono whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-red-200">
                            {practiceFeedback.explanation}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Bottom Action Bar (Desktop & Tablet) */}
                <div className="pt-4 border-t border-red-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleToggleMarkForReview}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center space-x-1.5 ${
                        answers[currentQ.id]?.isMarkedForReview
                          ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                          : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                      }`}
                    >
                      <Bookmark className="h-3.5 w-3.5 text-red-600" />
                      <span>{answers[currentQ.id]?.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
                    </button>

                    <button
                      onClick={handleClearResponse}
                      disabled={answers[currentQ.id]?.selectedOption === null}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 transition disabled:opacity-30 cursor-pointer"
                    >
                      Clear
                    </button>

                    {markedReviewCount > 0 && (
                      <div className="hidden sm:flex items-center space-x-1 pl-2 border-l border-red-200">
                        <button
                          onClick={handleJumpPrevMarked}
                          className="px-2.5 py-1.5 rounded-lg bg-white text-red-700 hover:bg-red-50 text-[11px] font-bold border border-red-200 transition cursor-pointer"
                          title="Jump to Previous Marked Question"
                        >
                          <span>◀ Prev Marked</span>
                        </button>
                        <button
                          onClick={handleJumpNextMarked}
                          className="px-2.5 py-1.5 rounded-lg bg-white text-red-700 hover:bg-red-50 text-[11px] font-bold border border-red-200 transition cursor-pointer"
                          title="Jump to Next Marked Question"
                        >
                          <span>Next Marked ▶</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-auto">
                    <button
                      onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentIndex === 0}
                      className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-white text-red-700 hover:bg-red-50 border border-red-200 transition disabled:opacity-30 flex items-center space-x-1 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>

                    {currentIndex < questions.length - 1 ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white shadow-md shadow-red-600/20 transition flex items-center space-x-1 cursor-pointer border border-red-500/30"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="h-4 w-4" />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setShowSubmitModal(true)}
                        className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md shadow-red-600/20 transition flex items-center space-x-1 cursor-pointer border border-red-500/30"
                      >
                        <span>Review & Submit</span>
                        <Send className="h-3.5 w-3.5" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Right Area: Desktop Question Palette (Sticky) */}
        {paletteOpen && (
          <aside className="hidden lg:block lg:col-span-4 bg-white rounded-2xl border border-red-200 shadow-xs p-5 space-y-4 sticky top-20 text-red-700">
            {/* Section Filter Pills */}
            {attempt.category === 'full' && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-600">Section Focus</span>
                <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'quantitative', label: 'Quant' },
                    { id: 'logical', label: 'Reason' },
                    { id: 'verbal', label: 'Verbal' }
                  ].map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSectionFilter(sec.id)}
                      className={`py-1.5 px-2 rounded-lg text-center cursor-pointer transition border ${
                        activeSectionFilter === sec.id
                          ? 'bg-red-600 text-white border-red-600 shadow-xs font-bold'
                          : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs border-b border-red-100 pb-3 font-mono">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600"></span>
                <span className="text-red-700">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300"></span>
                <span className="text-red-700">Unanswered ({notAnsweredVisitedCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                <span className="text-red-700">Marked ({markedReviewCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-100 border border-red-200"></span>
                <span className="text-red-700">Not Visited ({notVisitedCount})</span>
              </div>
            </div>

            {/* Question Palette Filter Tabs */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs font-semibold text-red-700">
                <span className="font-mono text-[10px] uppercase tracking-wider text-red-600">QUESTION PALETTE</span>
                <span className="font-mono text-red-600">{filteredPaletteQuestions.length} of {questions.length}</span>
              </div>

              <div className="grid grid-cols-3 gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setPaletteFilter('all')}
                  className={`py-1 rounded-lg text-center transition cursor-pointer border ${
                    paletteFilter === 'all'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                  }`}
                >
                  All ({questions.length})
                </button>
                <button
                  onClick={() => setPaletteFilter('marked')}
                  className={`py-1 rounded-lg text-center transition cursor-pointer flex items-center justify-center space-x-1 border ${
                    paletteFilter === 'marked'
                      ? 'bg-red-600 text-white border-red-600 font-bold'
                      : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                  }`}
                >
                  <span>★ Marked ({markedReviewCount})</span>
                </button>
                <button
                  onClick={() => setPaletteFilter('unanswered')}
                  className={`py-1 rounded-lg text-center transition cursor-pointer border ${
                    paletteFilter === 'unanswered'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                  }`}
                >
                  Unattempted
                </button>
              </div>

              {markedReviewCount > 0 && (
                <button
                  onClick={() => setShowMarkedQuestionsModal(true)}
                  className="w-full py-1.5 px-3 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Bookmark className="h-3.5 w-3.5 fill-red-600 text-red-600" />
                  <span>Review {markedReviewCount} Marked Questions</span>
                </button>
              )}

              {/* Number Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-72 overflow-y-auto pr-1">
                {filteredPaletteQuestions.map(({ q, idx }) => {
                  const status = getQuestionStatus(q.id, idx);
                  const isCurrent = idx === currentIndex;
                  const isMarked = !!answers[q.id]?.isMarkedForReview;

                  let colorClass = 'bg-white text-red-700 border-red-200 hover:bg-red-50';

                  if (status === 'answered') {
                    colorClass = 'bg-red-600 text-white font-bold border-red-700 shadow-2xs';
                  } else if (status === 'answered_marked_for_review') {
                    colorClass = 'bg-red-600 text-white border-red-700 ring-2 ring-red-400 font-bold';
                  } else if (status === 'marked_for_review') {
                    colorClass = 'bg-red-100 text-red-700 border-red-400 font-bold shadow-2xs';
                  } else if (status === 'not_answered') {
                    colorClass = 'bg-white text-red-700 border-red-200 hover:bg-red-50';
                  }

                  if (isCurrent) {
                    colorClass += ' ring-2 ring-red-600 ring-offset-2 font-black scale-105';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-lg border text-xs font-mono transition flex items-center justify-center relative cursor-pointer ${colorClass}`}
                      title={`Question ${idx + 1}${isMarked ? ' (Marked for Review)' : ''}`}
                    >
                      <span>{idx + 1}</span>
                      {isMarked && (
                        <span className="absolute -top-1 -right-1 text-[10px] text-red-800 font-black">
                          ★
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions in Palette */}
            <div className="pt-2 border-t border-red-100 space-y-2">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs shadow-md shadow-red-600/20 transition cursor-pointer border border-red-500/30"
              >
                Submit Exam
              </button>
              <button
                onClick={onExitExam}
                className="w-full py-2 rounded-lg text-red-600 hover:text-red-800 text-xs font-medium cursor-pointer"
              >
                Exit without Submitting
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Sticky Bottom Controls Bar - Designed for One-Thumb Reach */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-red-200 p-2.5 pb-safe flex items-center justify-between gap-2 shadow-lg">
        <button
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex-1 min-h-[46px] rounded-xl bg-white text-red-700 font-bold text-xs flex items-center justify-center space-x-1 border border-red-200 disabled:opacity-30 cursor-pointer hover:bg-red-50"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Prev</span>
        </button>

        <button
          onClick={handleToggleMarkForReview}
          className={`flex-1 min-h-[46px] rounded-xl text-xs font-bold flex items-center justify-center space-x-1 border cursor-pointer ${
            answers[currentQ?.id || '']?.isMarkedForReview
              ? 'bg-red-100 text-red-800 border-red-400 font-bold'
              : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
          }`}
        >
          <Bookmark className="h-3.5 w-3.5 text-red-600" />
          <span>{answers[currentQ?.id || '']?.isMarkedForReview ? 'Marked' : 'Mark'}</span>
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
            className="flex-1 min-h-[46px] rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-md shadow-red-600/20 border border-red-500/30 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex-1 min-h-[46px] rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-md shadow-red-600/20 border border-red-500/30 cursor-pointer"
          >
            <span>Submit</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Mobile Slide-Up Question Palette Sheet */}
      <AnimatePresence>
        {mobilePaletteOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-red-950/20 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl border-t border-red-200 p-5 max-h-[82vh] flex flex-col space-y-4 shadow-2xl text-red-700"
            >
              <div className="flex items-center justify-between border-b border-red-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Grid className="h-4 w-4 text-red-600" />
                  <h3 className="font-serif font-bold text-base text-red-700">
                    Question Palette ({answeredCount}/{questions.length} Attempted)
                  </h3>
                </div>
                <button
                  onClick={() => setMobilePaletteOpen(false)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-700"
                >
                  ✕
                </button>
              </div>

              {/* Status Filter Tabs on Mobile */}
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                <button
                  onClick={() => setPaletteFilter('all')}
                  className={`py-1.5 rounded-lg text-center transition cursor-pointer border ${
                    paletteFilter === 'all'
                      ? 'bg-red-600 text-white border-red-600 font-bold'
                      : 'bg-white text-red-700 border-red-200'
                  }`}
                >
                  All ({questions.length})
                </button>
                <button
                  onClick={() => setPaletteFilter('marked')}
                  className={`py-1.5 rounded-lg text-center transition cursor-pointer border ${
                    paletteFilter === 'marked'
                      ? 'bg-red-600 text-white font-bold border-red-600'
                      : 'bg-white text-red-700 border-red-200'
                  }`}
                >
                  Marked ({markedReviewCount})
                </button>
                <button
                  onClick={() => setPaletteFilter('unanswered')}
                  className={`py-1.5 rounded-lg text-center transition cursor-pointer border ${
                    paletteFilter === 'unanswered'
                      ? 'bg-red-600 text-white font-bold border-red-600'
                      : 'bg-white text-red-700 border-red-200'
                  }`}
                >
                  Unattempted
                </button>
              </div>

              {/* Question Grid in Mobile Sheet */}
              <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1">
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {filteredPaletteQuestions.map(({ q, idx }) => {
                    const status = getQuestionStatus(q.id, idx);
                    const isCurrent = idx === currentIndex;
                    const isMarked = !!answers[q.id]?.isMarkedForReview;

                    let colorClass = 'bg-white text-red-700 border-red-200';

                    if (status === 'answered') {
                      colorClass = 'bg-red-600 text-white font-bold border-red-700 shadow-2xs';
                    } else if (status === 'answered_marked_for_review') {
                      colorClass = 'bg-red-600 text-white border-red-700 ring-2 ring-red-400 font-bold';
                    } else if (status === 'marked_for_review') {
                      colorClass = 'bg-red-100 text-red-700 border-red-400 font-bold';
                    } else if (status === 'not_answered') {
                      colorClass = 'bg-white text-red-700 border-red-200';
                    }

                    if (isCurrent) {
                      colorClass += ' ring-2 ring-red-600 ring-offset-2 scale-105 font-black';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setCurrentIndex(idx);
                          setMobilePaletteOpen(false);
                        }}
                        className={`h-10 rounded-xl border text-xs font-mono transition flex items-center justify-center relative cursor-pointer ${colorClass}`}
                      >
                        <span>{idx + 1}</span>
                        {isMarked && (
                          <span className="absolute -top-1 -right-1 text-[10px] text-red-900 font-black">
                            ★
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-red-100 flex items-center space-x-2">
                <button
                  onClick={() => {
                    setMobilePaletteOpen(false);
                    setShowSubmitModal(true);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs shadow-md shadow-red-600/25 transition cursor-pointer border border-red-500/30"
                >
                  Submit Exam ({answeredCount}/{questions.length})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal before Submit */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/20 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-red-200 p-6 shadow-2xl space-y-5 text-red-700">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center border border-red-200">
                <Send className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-serif font-bold text-red-700">Submit Examination?</h3>
              <p className="text-xs text-red-600/80">
                Airi will automatically compute your score with -1.0 negative marking deductions.
              </p>
            </div>

            {/* Breakdown summary */}
            <div className="bg-white p-4 rounded-xl border border-red-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-red-600/80">Total Questions:</span>
                <span className="font-mono font-bold text-red-700">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700 font-semibold">Answered:</span>
                <span className="font-mono font-bold text-red-700">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600 font-semibold">Marked for Review:</span>
                <span className="font-mono font-bold text-red-600">{markedReviewCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-500 font-semibold">Unanswered:</span>
                <span className="font-mono font-bold text-red-500">{questions.length - answeredCount}</span>
              </div>
              <div className="pt-2 border-t border-red-100 flex justify-between">
                <span className="text-red-600/80">Time Remaining:</span>
                <span className="font-mono font-bold text-red-700">{formatTime(remainingSeconds)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
              >
                Resume Exam
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-bold shadow-md shadow-red-600/20 transition cursor-pointer border border-red-500/30 disabled:opacity-50"
              >
                {isSubmitting ? 'Evaluating...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Marked Questions Modal */}
      {showMarkedQuestionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/20 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-red-200 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-red-700">
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <div className="flex items-center space-x-2">
                <Bookmark className="h-5 w-5 text-red-600 fill-red-600" />
                <h3 className="text-lg font-serif font-bold text-red-700">
                  Marked Questions ({markedReviewCount})
                </h3>
              </div>
              <button
                onClick={() => setShowMarkedQuestionsModal(false)}
                className="text-red-400 hover:text-red-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {questions
                .map((q, idx) => ({ q, idx }))
                .filter(({ q }) => answers[q.id]?.isMarkedForReview)
                .map(({ q, idx }) => {
                  const ans = answers[q.id];
                  const hasAnswer = ans?.selectedOption !== null && ans?.selectedOption !== undefined;
                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowMarkedQuestionsModal(false);
                      }}
                      className="p-3 rounded-xl border border-red-200 hover:border-red-400 bg-white cursor-pointer transition flex items-center justify-between space-x-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 text-xs font-mono text-red-600 mb-1">
                          <span className="font-bold text-red-700">Q{idx + 1}</span>
                          <span>·</span>
                          <span className="truncate">{q.topicName}</span>
                          <span>·</span>
                          <span className={hasAnswer ? 'text-red-700 font-semibold' : 'text-red-500'}>
                            {hasAnswer ? `Option ${String.fromCharCode(65 + ans.selectedOption!)} selected` : 'Unanswered'}
                          </span>
                        </div>
                        <div className="text-xs text-red-800 line-clamp-1">
                          {q.questionText}
                        </div>
                      </div>

                      <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium shrink-0">
                        Jump →
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-red-100 flex justify-end">
              <button
                onClick={() => setShowMarkedQuestionsModal(false)}
                className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 cursor-pointer border border-red-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
