import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Database,
  Upload,
  Download,
  Settings,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit3,
  Search,
  Check,
  X,
  AlertCircle,
  Layers,
  BarChart,
  FileText
} from 'lucide-react';
import { ALL_TOPICS } from '../data/topics';
import { Question, AdminStats, DifficultyLevel, QuizSettings } from '../types/quiz';
import {
  fetchAdminStats,
  generateQuestions,
  fetchPendingQuestions,
  approveQuestion,
  rejectQuestion,
  fetchQuestions,
  addCustomQuestion,
  deleteQuestion,
  importQuestions,
  fetchSettings,
  updateSettings
} from '../services/api';

export const AdminStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'generator' | 'pending' | 'questions' | 'import-export' | 'settings'>('analytics');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [settings, setSettings] = useState<QuizSettings | null>(null);

  // Question Generator State
  const [genTopicId, setGenTopicId] = useState<string>(ALL_TOPICS[0].id);
  const [genDifficulty, setGenDifficulty] = useState<DifficultyLevel>('Medium');
  const [genCount, setGenCount] = useState<number>(10);
  const [genUseAi, setGenUseAi] = useState<boolean>(true);
  const [genLoading, setGenLoading] = useState<boolean>(false);
  const [genResultMsg, setGenResultMsg] = useState<string | null>(null);

  // Pending Review State
  const [pendingList, setPendingList] = useState<Question[]>([]);
  const [pendingLoading, setPendingLoading] = useState<boolean>(false);

  // Question Manager State
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [qSearch, setQSearch] = useState('');
  const [qTopicFilter, setQTopicFilter] = useState('');
  const [qLoading, setQLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New question form state
  const [newQTopicId, setNewQTopicId] = useState(ALL_TOPICS[0].id);
  const [newQDifficulty, setNewQDifficulty] = useState<DifficultyLevel>('Medium');
  const [newQText, setNewQText] = useState('');
  const [newQOptions, setNewQOptions] = useState<[string, string, string, string]>(['', '', '', '']);
  const [newQCorrectOpt, setNewQCorrectOpt] = useState<number>(0);
  const [newQExplanation, setNewQExplanation] = useState('');

  // Import / Export State
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json');
  const [importData, setImportData] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    loadSettings();
    loadPendingQuestions();
  }, []);

  const loadStats = async () => {
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPendingQuestions = async () => {
    try {
      setPendingLoading(true);
      const res = await fetchPendingQuestions();
      setPendingList(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setPendingLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      setQLoading(true);
      const res = await fetchQuestions({
        search: qSearch,
        topicId: qTopicFilter || undefined,
        limit: 50,
        offset: 0
      });
      setQuestionsList(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setQLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'questions') {
      loadQuestions();
    }
  }, [activeTab, qSearch, qTopicFilter]);

  // Handle Question Generation
  const handleGenerate = async () => {
    try {
      setGenLoading(true);
      setGenResultMsg(null);
      const res = await generateQuestions({
        topicId: genTopicId,
        difficulty: genDifficulty,
        count: genCount,
        useAi: genUseAi
      });
      setGenResultMsg(`Successfully generated ${res.count} questions via ${res.source.toUpperCase()} engine. Added to ${res.status === 'pending_review' ? 'Pending Review queue' : 'Active Bank'}!`);
      loadStats();
      loadPendingQuestions();
    } catch (err: any) {
      setGenResultMsg(`Generation failed: ${err.message}`);
    } finally {
      setGenLoading(false);
    }
  };

  // Handle Approve / Reject
  const handleApprove = async (id: string) => {
    try {
      await approveQuestion(id);
      setPendingList(prev => prev.filter(q => q.id !== id));
      loadStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectQuestion(id);
      setPendingList(prev => prev.filter(q => q.id !== id));
      loadStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Add Question
  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || newQOptions.some(o => !o.trim())) {
      alert('Please fill in question text and all 4 options');
      return;
    }
    try {
      await addCustomQuestion({
        topicId: newQTopicId,
        difficulty: newQDifficulty,
        questionText: newQText,
        options: newQOptions,
        correctOption: newQCorrectOpt,
        explanation: newQExplanation
      });
      setShowAddModal(false);
      setNewQText('');
      setNewQOptions(['', '', '', '']);
      setNewQExplanation('');
      loadQuestions();
      loadStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Delete Question
  const handleDeleteQ = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteQuestion(id);
      setQuestionsList(prev => prev.filter(q => q.id !== id));
      loadStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Import
  const handleImportSubmit = async () => {
    try {
      const res = await importQuestions(importFormat, importData);
      setImportMsg(`Successfully imported ${res.importedCount} questions.`);
      setImportData('');
      loadStats();
    } catch (err: any) {
      setImportMsg(`Import error: ${err.message}`);
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await updateSettings(settings);
      alert('Settings updated successfully!');
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-16 bg-white text-red-700">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-red-200 pb-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-red-600 font-bold flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            <span>MADE BY ANANTH · SYSTEM CONTROLS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-red-700 flex items-center space-x-2 mt-0.5">
            <ShieldCheck className="h-6 w-6 text-red-600" />
            <span>Admin Studio & Question Pipeline</span>
          </h1>
          <p className="text-xs sm:text-sm text-red-600/80 mt-1">
            Algorithmic question generation, schema validation, import/export, pending approvals, and exam settings.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl text-xs font-semibold border border-red-200 shadow-2xs">
          {[
            { id: 'analytics', label: 'Overview' },
            { id: 'generator', label: 'AI Generator' },
            { id: 'pending', label: `Pending (${pendingList.length})` },
            { id: 'questions', label: 'Bank Manager' },
            { id: 'import-export', label: 'Import/Export' },
            { id: 'settings', label: 'Settings' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer border ${
                activeTab === t.id
                  ? 'bg-red-600 text-white border-red-600 font-bold shadow-xs'
                  : 'text-red-700 border-transparent hover:bg-red-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Analytics Overview */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white border border-red-200 shadow-xs">
              <span className="text-[10px] font-mono text-red-600 font-bold uppercase tracking-wider">Total Questions</span>
              <div className="text-3xl font-serif font-bold text-red-700 mt-1">
                {stats.totalQuestions.toLocaleString()}
              </div>
              <div className="text-xs text-red-600/80 font-mono mt-1">
                Active: {stats.totalActiveQuestions} | Pending: {stats.totalPendingQuestions}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white border border-red-200 shadow-xs">
              <span className="text-[10px] font-mono text-red-600 font-bold uppercase tracking-wider">Total Attempts</span>
              <div className="text-3xl font-serif font-bold text-red-700 mt-1">
                {stats.totalAttempts}
              </div>
              <div className="text-xs text-red-600 font-mono font-semibold mt-1">
                Avg Score: {stats.averageScore}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white border border-red-200 shadow-xs">
              <span className="text-[10px] font-mono text-red-600 font-bold uppercase tracking-wider">Quantitative MCQs</span>
              <div className="text-3xl font-serif font-bold text-red-700 mt-1">
                {stats.questionsPerCategory.quantitative}
              </div>
              <div className="text-xs text-red-600/80 font-mono mt-1">Across 26 topics</div>
            </div>

            <div className="p-5 rounded-xl bg-white border border-red-200 shadow-xs">
              <span className="text-[10px] font-mono text-red-600 font-bold uppercase tracking-wider">Reasoning & Verbal</span>
              <div className="text-3xl font-serif font-bold text-red-700 mt-1">
                {stats.questionsPerCategory.logical + stats.questionsPerCategory.verbal}
              </div>
              <div className="text-xs text-red-600/80 font-mono mt-1">Across 36 topics</div>
            </div>
          </div>

          {/* Difficulty breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-red-200 space-y-4 shadow-xs">
            <h3 className="text-base font-serif font-bold text-red-700">
              Questions by Difficulty Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(['Easy', 'Medium', 'Hard', 'Expert'] as const).map(d => (
                <div key={d} className="p-3.5 rounded-xl bg-white border border-red-200 shadow-2xs">
                  <div className="text-xs font-mono font-semibold text-red-600 uppercase">{d} Tier</div>
                  <div className="text-xl font-serif font-bold text-red-700 mt-0.5">
                    {stats.questionsPerDifficulty[d]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Question Generator */}
      {activeTab === 'generator' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-red-200 shadow-xs space-y-6 max-w-3xl">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-red-700">
                Automated Question Generator Engine
              </h2>
              <p className="text-xs text-red-600/80">
                Generate high-quality aptitude MCQs with 4 options, verified math calculations, and step-by-step logic.
              </p>
            </div>
          </div>

          {/* Validation card */}
          <div className="p-4 rounded-xl bg-white border border-red-200 text-xs space-y-1.5 text-red-700">
            <div className="font-bold font-mono text-red-700 flex items-center space-x-1.5 uppercase text-[11px]">
              <CheckCircle className="h-4 w-4 text-red-600" />
              <span>Strict Validation Guarantee:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-red-600/90 text-[11px]">
              <li>Exactly 4 distinct options with zero duplicate choices.</li>
              <li>Exactly 1 mathematically proven correct answer.</li>
              <li>Comprehensive step-by-step calculation & formula explanation.</li>
              <li>Stored as "Pending Review" by default for admin approval before production release.</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-red-700">Select Aptitude Topic (62 Topics)</label>
              <select
                value={genTopicId}
                onChange={e => setGenTopicId(e.target.value)}
                className="mt-1 w-full p-2.5 rounded-lg border border-red-200 bg-white text-xs sm:text-sm font-medium focus:outline-none text-red-700 cursor-pointer"
              >
                {ALL_TOPICS.map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.category.slice(0, 5).toUpperCase()}] {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-red-700">Difficulty Level</label>
              <select
                value={genDifficulty}
                onChange={e => setGenDifficulty(e.target.value as any)}
                className="mt-1 w-full p-2.5 rounded-lg border border-red-200 bg-white text-xs sm:text-sm font-medium focus:outline-none text-red-700 cursor-pointer"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-red-700">Number of Questions</label>
              <input
                type="number"
                min={1}
                max={50}
                value={genCount}
                onChange={e => setGenCount(parseInt(e.target.value) || 5)}
                className="mt-1 w-full p-2.5 rounded-lg border border-red-200 bg-white text-xs sm:text-sm font-mono focus:outline-none text-red-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-red-700">Generator Model Mode</label>
              <div className="mt-1 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setGenUseAi(!genUseAi)}
                  className={`w-full py-2.5 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                    genUseAi
                      ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                      : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{genUseAi ? 'Gemini 3.8 AI Engine' : 'Procedural Math Engine'}</span>
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={genLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-sm shadow-md shadow-red-600/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2 border border-red-500/30"
          >
            {genLoading ? <span>Generating Questions...</span> : <span>Generate Question Batch</span>}
          </button>

          {genResultMsg && (
            <div className="p-3.5 rounded-lg bg-white border border-red-200 text-xs font-mono text-red-700">
              {genResultMsg}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Pending Review Queue */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-serif font-bold text-red-700">
                Pending Review Queue ({pendingList.length})
              </h2>
              <p className="text-xs text-red-600/80">
                Review and approve newly generated questions before making them active in the live exam bank.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {pendingList.length > 0 && (
                <>
                  <button
                    onClick={async () => {
                      if (!confirm(`Approve all ${pendingList.length} pending questions into the live question bank?`)) return;
                      for (const q of pendingList) {
                        await approveQuestion(q.id);
                      }
                      setPendingList([]);
                      loadStats();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-1 border border-red-500/30"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve All ({pendingList.length})</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Reject and delete all ${pendingList.length} pending questions?`)) return;
                      for (const q of pendingList) {
                        await rejectQuestion(q.id);
                      }
                      setPendingList([]);
                      loadStats();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 text-red-700 text-xs font-semibold cursor-pointer border border-red-200"
                  >
                    Reject All
                  </button>
                </>
              )}
              <button
                onClick={loadPendingQuestions}
                className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold hover:bg-red-50 text-red-700 cursor-pointer"
              >
                Refresh
              </button>
            </div>
          </div>

          {pendingList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-red-200 text-red-400 font-serif text-sm">
              No questions currently pending review. Use the AI Generator to create new questions.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingList.map(q => (
                <div
                  key={q.id}
                  className="bg-white p-5 rounded-xl border border-red-200 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-red-700">{q.topicName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-red-600 font-semibold border border-red-200">
                        {q.difficulty}
                      </span>
                      <span className="text-[10px] font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded font-medium border border-red-200">
                        Pending Approval
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApprove(q.id)}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer border border-red-500/30 shadow-xs"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Approve & Publish</span>
                      </button>
                      <button
                        onClick={() => handleReject(q.id)}
                        className="px-3 py-1 rounded-lg bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-sm font-serif font-medium text-red-800 whitespace-pre-wrap">
                    {q.questionText}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-lg border flex items-center space-x-2 ${
                          oIdx === q.correctOption
                            ? 'border-red-600 bg-red-50 text-red-800 font-bold'
                            : 'border-red-200 bg-white text-red-800'
                        }`}
                      >
                        <span className="font-mono">({String.fromCharCode(65 + oIdx)})</span>
                        <span>{opt}</span>
                        {oIdx === q.correctOption && (
                          <span className="ml-auto text-[10px] text-red-700 font-bold font-mono">Key Option</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-red-200 text-xs text-red-800 font-mono">
                    <strong className="text-red-700">Worked Derivation:</strong> {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Question Bank Manager */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 flex-1">
              <input
                type="text"
                placeholder="Search questions..."
                value={qSearch}
                onChange={e => setQSearch(e.target.value)}
                className="w-full sm:w-64 p-2 rounded-lg border border-red-200 bg-white text-xs text-red-700 placeholder:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <select
                value={qTopicFilter}
                onChange={e => setQTopicFilter(e.target.value)}
                className="p-2 rounded-lg border border-red-200 bg-white text-xs text-red-700 focus:outline-none cursor-pointer"
              >
                <option value="">All Topics</option>
                {ALL_TOPICS.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-semibold text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0 border border-red-500/30"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Question</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-red-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-red-200 bg-red-50/50 text-red-700 uppercase text-[10px] font-mono font-bold">
                    <th className="py-2.5 px-3">Question</th>
                    <th className="py-2.5 px-3">Topic</th>
                    <th className="py-2.5 px-3">Difficulty</th>
                    <th className="py-2.5 px-3">Correct Option</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {questionsList.map(q => (
                    <tr key={q.id} className="hover:bg-red-50/40 transition">
                      <td className="py-2.5 px-3 font-medium text-red-800 max-w-md truncate">
                        {q.questionText}
                      </td>
                      <td className="py-2.5 px-3 text-red-600/80 whitespace-nowrap">{q.topicName}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-red-700 border border-red-200">
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold font-mono text-red-700 whitespace-nowrap">
                        Option {String.fromCharCode(65 + q.correctOption)}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteQ(q.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Import / Export */}
      {activeTab === 'import-export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import Box */}
          <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-red-600" />
              <h2 className="text-base font-serif font-bold text-red-700">Import Questions</h2>
            </div>
            <p className="text-xs text-red-600/80">
              Bulk import questions using JSON or CSV format. Schema validation is automatically enforced.
            </p>

            <div className="flex items-center space-x-3">
              <label className="text-xs font-bold text-red-700">Format:</label>
              <button
                onClick={() => setImportFormat('json')}
                className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                  importFormat === 'json' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                }`}
              >
                JSON
              </button>
              <button
                onClick={() => setImportFormat('csv')}
                className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                  importFormat === 'csv' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                }`}
              >
                CSV
              </button>
            </div>

            <textarea
              rows={8}
              placeholder={
                importFormat === 'json'
                  ? '[\n  {\n    "topic": "Percentages",\n    "difficulty": "Medium",\n    "question": "What is 20% of 250?",\n    "options": ["40", "50", "60", "70"],\n    "correctOption": 1,\n    "explanation": "20/100 * 250 = 50"\n  }\n]'
                  : 'Topic,Difficulty,Question,OptionA,OptionB,OptionC,OptionD,CorrectOption,Explanation\nPercentages,Medium,What is 20% of 250?,40,50,60,70,1,20/100 * 250 = 50'
              }
              value={importData}
              onChange={e => setImportData(e.target.value)}
              className="w-full p-3 rounded-xl border border-red-200 bg-white font-mono text-xs text-red-700 placeholder:text-red-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />

            <button
              onClick={handleImportSubmit}
              disabled={!importData.trim()}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer border border-red-500/30"
            >
              Parse & Import Questions
            </button>

            {importMsg && (
              <div className="p-3 rounded-lg bg-white border border-red-200 text-xs font-mono text-red-700">
                {importMsg}
              </div>
            )}
          </div>

          {/* Export Box */}
          <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-red-600" />
              <h2 className="text-base font-serif font-bold text-red-700">Export Question Bank</h2>
            </div>
            <p className="text-xs text-red-600/80">
              Download the complete active aptitude question library for backup, auditing, or print publishing.
            </p>

            <div className="pt-4 space-y-3">
              <a
                href="/api/questions/export?format=csv"
                download
                className="w-full py-3 rounded-lg bg-white hover:bg-red-50 text-red-700 font-semibold text-xs flex items-center justify-center space-x-2 transition border border-red-200"
              >
                <Download className="h-4 w-4 text-red-600" />
                <span>Export Active Bank as CSV (Spreadsheet)</span>
              </a>

              <a
                href="/api/questions/export?format=json"
                download
                className="w-full py-3 rounded-lg bg-white hover:bg-red-50 text-red-700 font-semibold text-xs flex items-center justify-center space-x-2 transition border border-red-200"
              >
                <Download className="h-4 w-4 text-red-600" />
                <span>Export Active Bank as JSON (Raw Data)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Settings */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-2xl border border-red-200 shadow-xs space-y-6 max-w-2xl">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-serif font-bold text-red-700">Examination & Scoring Configuration</h2>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="font-bold text-red-700">Marks for Correct Answer</label>
              <input
                type="number"
                step="0.25"
                value={settings.markingCorrect}
                onChange={e => setSettings({ ...settings, markingCorrect: parseFloat(e.target.value) || 1 })}
                className="mt-1 w-full p-2.5 rounded-lg border border-red-200 bg-white text-red-700 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="font-bold text-red-700">Negative Marks for Wrong Answer</label>
              <input
                type="number"
                step="0.25"
                value={settings.markingWrong}
                onChange={e => setSettings({ ...settings, markingWrong: parseFloat(e.target.value) || -1 })}
                className="mt-1 w-full p-2.5 rounded-lg border border-red-200 bg-white text-red-700 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-[11px] text-red-600/80 mt-1 font-mono">Default is -1.0 mark deducted per incorrect response.</p>
            </div>

            <div>
              <label className="font-bold text-red-700">Marks for Unattempted Questions</label>
              <input
                type="number"
                disabled
                value={0}
                className="mt-1 w-full p-2.5 rounded-lg border border-red-200 bg-white opacity-60 font-mono text-red-700"
              />
              <p className="text-[11px] text-red-600/80 mt-1 font-mono">Unattempted questions are strictly 0 marks (never penalized).</p>
            </div>

            <div className="border-t border-red-100 pt-4 space-y-3">
              <h3 className="font-serif font-bold text-red-700">Master Test Default Parameters</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-red-600 font-mono">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={settings.masterTestDurationMinutes}
                    onChange={e => setSettings({ ...settings, masterTestDurationMinutes: parseInt(e.target.value) || 100 })}
                    className="mt-1 w-full p-2.5 rounded-lg border border-red-200 bg-white text-xs font-mono text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-red-600 font-mono">Total Questions</label>
                  <input
                    type="number"
                    value={settings.masterTestQuestionsCount}
                    onChange={e => setSettings({ ...settings, masterTestQuestionsCount: parseInt(e.target.value) || 100 })}
                    className="mt-1 w-full p-2.5 rounded-lg border border-red-200 bg-white text-xs font-mono text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-semibold text-sm shadow-xs transition cursor-pointer border border-red-500/30"
          >
            Save Configuration Changes
          </button>
        </form>
      )}

      {/* Modal: Add Custom Question */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/20 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleAddQuestionSubmit}
            className="bg-white w-full max-w-lg rounded-2xl border border-red-200 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-red-700"
          >
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <h3 className="text-base font-serif font-bold text-red-700">Add Custom MCQ</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-red-400 hover:text-red-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-red-700">Topic</label>
                  <select
                    value={newQTopicId}
                    onChange={e => setNewQTopicId(e.target.value)}
                    className="mt-1 w-full p-2 rounded-lg border border-red-200 bg-white text-red-700 cursor-pointer"
                  >
                    {ALL_TOPICS.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-red-700">Difficulty</label>
                  <select
                    value={newQDifficulty}
                    onChange={e => setNewQDifficulty(e.target.value as any)}
                    className="mt-1 w-full p-2 rounded-lg border border-red-200 bg-white text-red-700 cursor-pointer"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-red-700">Question Text</label>
                <textarea
                  rows={3}
                  required
                  value={newQText}
                  onChange={e => setNewQText(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-lg border border-red-200 bg-white font-serif text-sm text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-red-700">4 Options (Select Radio for Correct)</label>
                {newQOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={newQCorrectOpt === idx}
                      onChange={() => setNewQCorrectOpt(idx)}
                      className="cursor-pointer accent-red-600"
                    />
                    <span className="font-mono text-xs w-5 font-bold text-red-700">({String.fromCharCode(65 + idx)})</span>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      value={opt}
                      onChange={e => {
                        const copy: [string, string, string, string] = [...newQOptions];
                        copy[idx] = e.target.value;
                        setNewQOptions(copy);
                      }}
                      className="flex-1 p-2 rounded-lg border border-red-200 bg-white text-xs text-red-800 placeholder:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="font-bold text-red-700">Step-by-Step Explanation</label>
                <textarea
                  rows={3}
                  required
                  value={newQExplanation}
                  onChange={e => setNewQExplanation(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-lg border border-red-200 bg-white font-mono text-xs text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-lg border border-red-200 text-xs font-semibold text-red-700 cursor-pointer hover:bg-red-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer border border-red-500/30"
              >
                Add Question
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
