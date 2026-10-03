import React, { useState } from 'react';
import {
  Palette,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Bookmark,
  ChevronRight,
  Grid,
  Maximize2,
  RefreshCw,
  Zap,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type RedThemeVariant = 'editorial' | 'swiss' | 'brutalist' | 'terminal';

interface PossibleUIViewerProps {
  currentThemeVariant: RedThemeVariant;
  onSelectThemeVariant: (theme: RedThemeVariant) => void;
  onNavigateToTab?: (tab: string) => void;
}

interface ThemeConfig {
  id: RedThemeVariant;
  name: string;
  tagline: string;
  description: string;
  typography: string;
  borders: string;
  shadows: string;
  corners: string;
  keyTraits: string[];
}

const THEME_CONFIGS: ThemeConfig[] = [
  {
    id: 'editorial',
    name: 'Editorial Academic (The Monograph)',
    tagline: 'Classical literary prestige with delicate crimson hairlines',
    description: 'Inspired by scholarly publications, university benchmark journals, and classical editorial print. Uses elegant Newsreader serif headlines, hairline borders, and refined deep ruby accents.',
    typography: 'Newsreader Serif + Plus Jakarta Sans body',
    borders: '1px delicate hairline (border-red-200 / border-red-300)',
    shadows: 'Subtle soft feather diffusion (shadow-xs / shadow-2xs)',
    corners: 'Graceful rounded corners (rounded-2xl)',
    keyTraits: [
      'Refined literary serif headings',
      'Ultra-clean white paper background',
      'Delicate hairline dividers',
      'Pristine mathematical proof boxes'
    ]
  },
  {
    id: 'swiss',
    name: 'Swiss Graphic (International Bauhaus)',
    tagline: 'High-impact geometric sans-serif with architectural precision',
    description: 'Rooted in the Swiss International Typographic Style. Features bold sans-serif geometric hierarchy, solid high-contrast red indicator blocks, and structured mathematical alignment.',
    typography: 'Plus Jakarta Sans Bold + JetBrains Mono',
    borders: 'Crisp medium rules (1.5px border-red-400)',
    shadows: 'Clean crisp drop shadows (shadow-sm)',
    corners: 'Structured modern corners (rounded-xl)',
    keyTraits: [
      'Bold geometric typography',
      'High-contrast solid red badges',
      'Architectural visual rhythm',
      'Crisp segmented controls'
    ]
  },
  {
    id: 'brutalist',
    name: 'Neo-Brutalist Crimson (The Graphic Cut)',
    tagline: 'Bold 2px outlines with hard tactile offset drop-shadows',
    description: 'A punchy, contemporary modern design movement. Pure white containers encased in 2px solid red outlines, paired with hard-edged tactile red drop shadows (4px 4px 0px #dc2626).',
    typography: 'Heavy Sans-Serif + Heavy Monospace',
    borders: '2px solid vivid red outlines (border-2 border-red-600)',
    shadows: 'Hard graphic offset shadows (shadow-[4px_4px_0px_#dc2626])',
    corners: 'Slightly rounded chunky corners (rounded-lg)',
    keyTraits: [
      '2px thick solid red borders',
      'Hard tactile graphic drop-shadows',
      'Chunky responsive button presses',
      'Maximum visibility & high contrast'
    ]
  },
  {
    id: 'terminal',
    name: 'Technical Blueprint (Precision Telemetry)',
    tagline: 'Monospaced engineering coordinates with technical crosshairs',
    description: 'Designed like a precision engineering console or aeronautical examination terminal. Monospaced coordinates, technical crosshair dividers, bracketed status telemetry, and sharp grid structures.',
    typography: 'Pure JetBrains Mono throughout',
    borders: 'Technical 1px red boundary rules (border-red-400)',
    shadows: 'Zero soft blur (flat technical boundary lines)',
    corners: 'Sharp minimal corners (rounded-none to rounded-xs)',
    keyTraits: [
      'JetBrains Mono monospace typography',
      'Bracketed tags [01/100], [CORRECT]',
      'Technical crosshair [+] markers',
      'Engineered coordinate data readouts'
    ]
  }
];

export const PossibleUIViewer: React.FC<PossibleUIViewerProps> = ({
  currentThemeVariant,
  onSelectThemeVariant,
  onNavigateToTab
}) => {
  const [selectedPreviewTheme, setSelectedPreviewTheme] = useState<RedThemeVariant>(currentThemeVariant);
  const [viewMode, setViewMode] = useState<'interactive' | 'side-by-side'>('interactive');
  
  // Interactive sandbox state
  const [selectedOption, setSelectedOption] = useState<number | null>(1);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(true);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  const activeThemeObj = THEME_CONFIGS.find(t => t.id === selectedPreviewTheme) || THEME_CONFIGS[0];

  const handleApplyToApp = (themeId: RedThemeVariant) => {
    onSelectThemeVariant(themeId);
    setAppliedToast(`"${THEME_CONFIGS.find(t => t.id === themeId)?.name}" applied app-wide!`);
    setTimeout(() => {
      setAppliedToast(null);
    }, 3500);
  };

  return (
    <div className="space-y-8 pb-20 sm:pb-16 bg-white text-red-700">
      {/* Toast Notification */}
      {appliedToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-6 z-50 bg-white border-2 border-red-600 text-red-700 px-5 py-3 rounded-xl shadow-xl font-bold text-xs sm:text-sm flex items-center space-x-2"
        >
          <CheckCircle2 className="h-4 w-4 text-red-600" />
          <span>{appliedToast}</span>
        </motion.div>
      )}

      {/* Header Banner */}
      <div className="border-b border-red-200 pb-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-red-600 font-bold flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
              <span>DESIGN LAB · WHITE BACKGROUND & RED TEXT FORMAT</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-red-700 flex items-center space-x-2.5 mt-1">
              <Palette className="h-7 w-7 text-red-600" />
              <span>Possible UI Design Variations</span>
            </h1>
            <p className="text-xs sm:text-sm text-red-600/80 mt-1 max-w-2xl leading-relaxed">
              Explore 4 distinct design interpretations of the pure White Background & Red Text format.
              Test interactive widgets, compare aesthetics side-by-side, and apply your preferred style live across the entire application.
            </p>
          </div>

          {/* View Mode Toggle: Interactive Sandbox vs Side-by-Side Comparison */}
          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-red-200 shadow-2xs self-start sm:self-auto shrink-0">
            <button
              onClick={() => setViewMode('interactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'interactive'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-red-700 hover:bg-red-50'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Interactive Sandbox</span>
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'side-by-side'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-red-700 hover:bg-red-50'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Side-by-Side Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Theme Cards Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {THEME_CONFIGS.map(theme => {
          const isSelected = selectedPreviewTheme === theme.id;
          const isAppActive = currentThemeVariant === theme.id;

          return (
            <motion.div
              key={theme.id}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedPreviewTheme(theme.id)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white relative flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'border-red-600 ring-2 ring-red-500/20 shadow-md shadow-red-600/10'
                  : 'border-red-200 hover:border-red-400 shadow-xs'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-red-600">
                    Style {THEME_CONFIGS.indexOf(theme) + 1}
                  </span>
                  {isAppActive && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-300">
                      Active on App
                    </span>
                  )}
                </div>

                <h3 className="font-serif font-bold text-base sm:text-lg text-red-700 leading-snug">
                  {theme.name}
                </h3>

                <p className="text-xs text-red-600/80 leading-relaxed">
                  {theme.tagline}
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-red-100">
                <div className="text-[11px] font-mono text-red-600 space-y-1">
                  <div><strong className="text-red-700">Type:</strong> {theme.typography}</div>
                  <div><strong className="text-red-700">Border:</strong> {theme.borders}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyToApp(theme.id);
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer border ${
                      isAppActive
                        ? 'bg-red-50 text-red-700 border-red-300'
                        : 'bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-xs'
                    }`}
                  >
                    <Check className="h-3 w-3" />
                    <span>{isAppActive ? 'Current Style' : 'Apply to App'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ================= VIEW MODE 1: INTERACTIVE SANDBOX ================= */}
      {viewMode === 'interactive' && (
        <div className="space-y-8">
          {/* Active Theme Spotlight Banner */}
          <div className="bg-white rounded-2xl border border-red-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono uppercase tracking-widest text-red-600 font-bold">
                  PREVIEWING STYLE:
                </span>
                <span className="text-sm font-bold text-red-700 font-serif">
                  {activeThemeObj.name}
                </span>
              </div>
              <p className="text-xs text-red-600/80 max-w-2xl">
                {activeThemeObj.description}
              </p>
            </div>

            <button
              onClick={() => handleApplyToApp(activeThemeObj.id)}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 transition flex items-center space-x-2 cursor-pointer border border-red-500/30 shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              <span>Apply This Style App-Wide</span>
            </button>
          </div>

          {/* Interactive Live Component Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left 7 cols: Interactive Question Card in chosen style */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between border-b border-red-200 pb-2">
                <h3 className="font-serif font-bold text-lg text-red-700 flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-red-600" />
                  <span>Exam Question Runner Preview</span>
                </h3>
                <span className="text-xs font-mono text-red-600">Interactive Clickable</span>
              </div>

              {/* RENDERED QUESTION CARD ACCORDING TO SELECTED THEME */}
              <div
                className={`bg-white transition-all ${
                  selectedPreviewTheme === 'editorial'
                    ? 'p-6 sm:p-8 rounded-2xl border border-red-200 shadow-xs space-y-6'
                    : selectedPreviewTheme === 'swiss'
                    ? 'p-6 sm:p-8 rounded-xl border-2 border-red-400 shadow-sm space-y-6'
                    : selectedPreviewTheme === 'brutalist'
                    ? 'p-6 sm:p-8 rounded-lg border-2 border-red-600 shadow-[4px_4px_0px_#dc2626] space-y-6'
                    : 'p-6 sm:p-8 rounded-none border border-red-500 space-y-6 font-mono'
                }`}
              >
                {/* Meta row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 ${
                        selectedPreviewTheme === 'brutalist'
                          ? 'bg-red-600 text-white rounded border border-red-600'
                          : selectedPreviewTheme === 'terminal'
                          ? 'border border-red-600 text-red-700 bg-white'
                          : 'bg-red-600 text-white rounded-lg shadow-2xs'
                      }`}
                    >
                      {selectedPreviewTheme === 'terminal' ? '[Q-04]' : 'Question 4'}
                    </span>
                    <span className="text-xs text-red-600 font-mono">of 100</span>
                    <span className="text-red-300">·</span>
                    <span className="text-xs font-semibold text-red-700">Time, Speed & Distance</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-red-200 bg-white text-red-700 font-bold">
                      Medium
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Bookmark Question"
                    >
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-red-600' : ''}`} />
                    </button>
                    <div className="px-2 py-0.5 rounded bg-white text-red-700 font-bold border border-red-200 text-xs font-mono">
                      +1.0 / -1.0
                    </div>
                  </div>
                </div>

                {/* Question Statement */}
                <div
                  className={`text-base sm:text-lg leading-relaxed text-red-800 ${
                    selectedPreviewTheme === 'editorial'
                      ? 'font-serif font-medium'
                      : selectedPreviewTheme === 'terminal'
                      ? 'font-mono text-sm'
                      : 'font-sans font-semibold'
                  }`}
                >
                  A high-speed train traveling at 72 km/h crosses a 250m long platform in 26 seconds.
                  What is the length of the train in meters?
                </div>

                {/* 4 Interactive Option Cards */}
                <div className="space-y-3 pt-1">
                  {[
                    { label: '240 meters', optIdx: 0 },
                    { label: '270 meters (Correct)', optIdx: 1 },
                    { label: '290 meters', optIdx: 2 },
                    { label: '310 meters', optIdx: 3 }
                  ].map(({ label, optIdx }) => {
                    const isSelected = selectedOption === optIdx;
                    const letter = String.fromCharCode(65 + optIdx);

                    // Dynamic styling based on theme
                    let cardClass = '';
                    if (selectedPreviewTheme === 'editorial') {
                      cardClass = isSelected
                        ? 'border-red-600 bg-red-50 text-red-800 font-bold ring-2 ring-red-500/25 rounded-xl'
                        : 'border-red-200 hover:border-red-400 bg-white text-red-800 rounded-xl';
                    } else if (selectedPreviewTheme === 'swiss') {
                      cardClass = isSelected
                        ? 'border-2 border-red-600 bg-red-600 text-white font-bold rounded-xl'
                        : 'border-2 border-red-200 hover:border-red-400 bg-white text-red-700 rounded-xl';
                    } else if (selectedPreviewTheme === 'brutalist') {
                      cardClass = isSelected
                        ? 'border-2 border-red-600 bg-red-100 text-red-900 font-black shadow-[3px_3px_0px_#dc2626] rounded-lg'
                        : 'border-2 border-red-400 hover:border-red-600 bg-white text-red-800 shadow-[2px_2px_0px_#fca5a5] rounded-lg';
                    } else {
                      // terminal
                      cardClass = isSelected
                        ? 'border-2 border-red-600 bg-white text-red-700 font-bold rounded-none'
                        : 'border border-red-300 hover:border-red-500 bg-white text-red-700 rounded-none';
                    }

                    return (
                      <div
                        key={optIdx}
                        onClick={() => setSelectedOption(optIdx)}
                        className={`p-3.5 border transition cursor-pointer flex items-center justify-between space-x-3 select-none ${cardClass}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span
                            className={`h-7 w-7 flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                              selectedPreviewTheme === 'swiss' && isSelected
                                ? 'bg-white text-red-700 rounded-lg'
                                : selectedPreviewTheme === 'brutalist'
                                ? 'border-2 border-red-600 bg-white text-red-700 rounded'
                                : 'border border-red-200 bg-white text-red-700 rounded-lg'
                            }`}
                          >
                            {selectedPreviewTheme === 'terminal' ? `[${letter}]` : letter}
                          </span>
                          <span className="text-sm font-medium">{label}</span>
                        </div>

                        {isSelected && (
                          <div className="h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {isAnswerChecked && (
                  <div
                    className={`p-4 bg-white border border-red-200 space-y-2 text-xs text-red-800 ${
                      selectedPreviewTheme === 'brutalist'
                        ? 'border-2 border-red-600 shadow-[3px_3px_0px_#dc2626] rounded-lg'
                        : selectedPreviewTheme === 'terminal'
                        ? 'border border-red-400 font-mono rounded-none'
                        : 'rounded-xl'
                    }`}
                  >
                    <div className="font-mono font-bold text-red-700 uppercase tracking-wider flex items-center space-x-1.5">
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>Worked Derivation & Formula:</span>
                    </div>
                    <div className="font-mono leading-relaxed bg-white p-3 rounded border border-red-200 text-red-800">
                      Speed = 72 km/h = 72 × (5/18) = 20 m/s.<br />
                      Total Distance = Speed × Time = 20 × 26 = 520 meters.<br />
                      Train Length = Total Distance - Platform Length = 520 - 250 = <strong>270 meters</strong>.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 cols: Scorecard & Dashboard Widget Preview in chosen style */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between border-b border-red-200 pb-2">
                <h3 className="font-serif font-bold text-lg text-red-700 flex items-center space-x-2">
                  <Award className="h-5 w-5 text-red-600" />
                  <span>Scorecard & Metrics Preview</span>
                </h3>
                <span className="text-xs font-mono text-red-600">Sample Widget</span>
              </div>

              {/* RENDERED SCORECARD WIDGET ACCORDING TO SELECTED THEME */}
              <div
                className={`bg-white transition-all space-y-5 ${
                  selectedPreviewTheme === 'editorial'
                    ? 'p-6 rounded-2xl border border-red-200 shadow-xs'
                    : selectedPreviewTheme === 'swiss'
                    ? 'p-6 rounded-xl border-2 border-red-400 shadow-sm'
                    : selectedPreviewTheme === 'brutalist'
                    ? 'p-6 rounded-lg border-2 border-red-600 shadow-[4px_4px_0px_#dc2626]'
                    : 'p-6 rounded-none border border-red-500 font-mono'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-red-600 font-bold">
                    Official Test Scorecard
                  </span>
                  <span className="text-xs font-mono font-bold text-red-700">
                    AIRI MASTER #49
                  </span>
                </div>

                <div className="pt-1">
                  <div className="text-4xl sm:text-5xl font-serif font-bold text-red-700">
                    88.0 <span className="text-xl sm:text-2xl font-mono text-red-400 font-normal">/ 100</span>
                  </div>
                  <div className="text-xs text-red-600 font-mono mt-1">
                    Net Score (Accounting for -1.0 deductions)
                  </div>
                </div>

                {/* Progress bar in chosen style */}
                <div className="space-y-1">
                  <div className="w-full bg-red-100 h-2.5 rounded-full overflow-hidden border border-red-200">
                    <div className="h-full bg-gradient-to-r from-red-600 to-rose-600 w-[88%]" />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-red-600">
                    <span>Accuracy: 92.5%</span>
                    <span className="font-bold text-red-700">88% Net</span>
                  </div>
                </div>

                {/* 4 Stat Tiles */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-white border border-red-200 rounded-xl">
                    <span className="text-[10px] font-mono text-red-600 uppercase font-bold">Correct</span>
                    <div className="text-xl font-serif font-bold text-red-700 mt-0.5">90</div>
                    <span className="text-[10px] text-red-600 font-mono">+90.0 marks</span>
                  </div>
                  <div className="p-3 bg-white border border-red-200 rounded-xl">
                    <span className="text-[10px] font-mono text-red-600 uppercase font-bold">Wrong</span>
                    <div className="text-xl font-serif font-bold text-red-700 mt-0.5">2</div>
                    <span className="text-[10px] text-red-600 font-mono">-2.0 penalty</span>
                  </div>
                  <div className="p-3 bg-white border border-red-200 rounded-xl">
                    <span className="text-[10px] font-mono text-red-600 uppercase font-bold">Skipped</span>
                    <div className="text-xl font-serif font-bold text-red-700 mt-0.5">8</div>
                    <span className="text-[10px] text-red-600 font-mono">0 penalty</span>
                  </div>
                  <div className="p-3 bg-white border border-red-200 rounded-xl">
                    <span className="text-[10px] font-mono text-red-600 uppercase font-bold">Time Taken</span>
                    <div className="text-xl font-serif font-bold text-red-700 mt-0.5">64m</div>
                    <span className="text-[10px] text-red-600 font-mono">of 100 mins</span>
                  </div>
                </div>

                {/* Primary Action Button Demonstration */}
                <div className="pt-2">
                  <button
                    className={`w-full py-3 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 cursor-pointer transition ${
                      selectedPreviewTheme === 'editorial'
                        ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-xl shadow-md shadow-red-600/20'
                        : selectedPreviewTheme === 'swiss'
                        ? 'bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs uppercase tracking-wider'
                        : selectedPreviewTheme === 'brutalist'
                        ? 'bg-red-600 hover:bg-red-700 text-white rounded-lg border-2 border-red-700 shadow-[3px_3px_0px_#991b1b] active:translate-x-0.5 active:translate-y-0.5'
                        : 'bg-white hover:bg-red-50 text-red-700 border-2 border-red-600 font-mono rounded-none'
                    }`}
                  >
                    <span>Launch Retake Drill</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW MODE 2: SIDE-BY-SIDE MATRIX ================= */}
      {viewMode === 'side-by-side' && (
        <div className="space-y-6">
          <div className="border-b border-red-200 pb-3">
            <h2 className="text-xl font-serif font-bold text-red-700">
              Direct Comparison Matrix (All 4 Styles Side-by-Side)
            </h2>
            <p className="text-xs text-red-600/80 mt-1">
              Compare how each design variant interprets the exact same question card and controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {THEME_CONFIGS.map(theme => (
              <div
                key={theme.id}
                className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-red-100 pb-2">
                  <div>
                    <span className="text-[10px] font-mono text-red-600 font-bold uppercase tracking-wider">
                      Style {THEME_CONFIGS.indexOf(theme) + 1}
                    </span>
                    <h3 className="font-serif font-bold text-base text-red-700">
                      {theme.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleApplyToApp(theme.id)}
                    className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition cursor-pointer"
                  >
                    Select
                  </button>
                </div>

                {/* Rendered Mockup Snippet */}
                <div
                  className={`p-4 bg-white space-y-3 ${
                    theme.id === 'editorial'
                      ? 'rounded-xl border border-red-200 font-serif'
                      : theme.id === 'swiss'
                      ? 'rounded-xl border-2 border-red-400 font-sans'
                      : theme.id === 'brutalist'
                      ? 'rounded-lg border-2 border-red-600 shadow-[3px_3px_0px_#dc2626] font-sans'
                      : 'rounded-none border border-red-500 font-mono text-xs'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-red-700">Q1. Probability</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 border border-red-200 rounded">Easy</span>
                  </div>

                  <p className="text-xs sm:text-sm text-red-800 font-medium">
                    What is the probability of rolling a prime number with a fair 6-sided die?
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded border border-red-200 bg-white text-red-800">
                      (A) 1/3
                    </div>
                    <div className="p-2 rounded border-2 border-red-600 bg-red-50 text-red-800 font-bold">
                      (B) 1/2 ✓
                    </div>
                  </div>

                  <button className="w-full py-1.5 text-xs font-bold rounded bg-red-600 text-white">
                    Submit Answer
                  </button>
                </div>

                <div className="text-[11px] text-red-600/80 font-mono space-y-0.5">
                  <div><strong>Key:</strong> {theme.tagline}</div>
                  <div><strong>Font:</strong> {theme.typography}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specifications & WCAG Contrast Guarantee */}
      <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5 text-red-600" />
          <h3 className="font-serif font-bold text-base text-red-700">
            Accessibility & Color Harmony Guarantee
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-red-200 bg-white space-y-1">
            <span className="font-mono text-red-600 font-bold uppercase text-[10px]">WCAG Contrast</span>
            <div className="text-xl font-serif font-bold text-red-700">7.6:1 AAA</div>
            <p className="text-red-600/80 text-[11px]">Exceeds highest accessibility contrast guidelines for maximum legibility.</p>
          </div>

          <div className="p-4 rounded-xl border border-red-200 bg-white space-y-1">
            <span className="font-mono text-red-600 font-bold uppercase text-[10px]">Palette Harmony</span>
            <div className="text-xl font-serif font-bold text-red-700">#FFFFFF + #B91C1C</div>
            <p className="text-red-600/80 text-[11px]">Strict two-tone color discipline with pure white canvas and crimson ink.</p>
          </div>

          <div className="p-4 rounded-xl border border-red-200 bg-white space-y-1">
            <span className="font-mono text-red-600 font-bold uppercase text-[10px]">Device Calibration</span>
            <div className="text-xl font-serif font-bold text-red-700">OLED & Retina</div>
            <p className="text-red-600/80 text-[11px]">Engineered for high pixel density displays with anti-aliasing font smoothing.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
