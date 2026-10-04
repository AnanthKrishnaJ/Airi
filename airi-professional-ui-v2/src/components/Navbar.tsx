import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Award,
  Bookmark,
  Database,
  ShieldCheck,
  Sparkles,
  Palette
} from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  activeExamTitle?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeExamTitle
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-red-200 transition-colors shadow-xs">
      {/* Vibrant red animated gradient top hairline */}
      <div className="h-1 w-full bg-gradient-to-r from-red-600 via-rose-500 to-red-500 animate-gradient-flow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Editorial Attribution */}
          <div
            className="flex items-center space-x-3 cursor-pointer group select-none"
            onClick={() => onSelectTab('dashboard')}
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 flex items-center justify-center text-white shadow-md shadow-red-600/30 border border-red-400/40"
            >
              <span className="font-serif font-bold text-xl italic leading-none text-white drop-shadow-xs">A</span>
            </motion.div>
            <div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono tracking-widest text-red-600 uppercase font-bold leading-tight flex items-center space-x-1">
                  <span>made by Ananth</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-red-600 inline-block animate-pulse" />
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-serif font-bold tracking-tight text-red-700">
                    Airi<span className="text-red-500 font-serif">.</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-red-700 font-bold hidden sm:inline px-2 py-0.5 rounded-full bg-red-50 border border-red-200">
                    Pro v4.2
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          {!activeExamTitle && (
            <nav className="hidden md:flex items-center space-x-1 p-1 bg-white rounded-xl border border-red-200 shadow-2xs">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'possible-uis', label: 'Possible UIs', icon: Palette, badge: '4' },
                { id: 'topics', label: '62 Topics', icon: BookOpen },
                { id: 'master-exam', label: 'Master Exam', icon: Award },
                { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
                { id: 'question-bank', label: 'Question Bank', icon: Database },
                { id: 'admin', label: 'Admin Studio', icon: ShieldCheck }
              ].map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all flex items-center space-x-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm shadow-red-600/25 font-bold'
                        : 'text-red-700 hover:text-red-800 hover:bg-red-50'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-red-600'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-mono px-1 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Active Exam indicator in header */}
          {activeExamTitle && (
            <div className="flex items-center space-x-2 bg-red-50 border border-red-300 px-3 py-1.5 rounded-xl text-xs font-medium text-red-900 shadow-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <span className="font-bold text-red-800">Live Test:</span>
              <span className="truncate max-w-[160px] sm:max-w-[220px] font-serif font-medium text-red-900">{activeExamTitle}</span>
            </div>
          )}

          {/* Right Action Controls: Possible UIs Quick Button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSelectTab('possible-uis')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-bold transition cursor-pointer ${
                currentTab === 'possible-uis'
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
              }`}
              title="Explore 4 Possible UI Layouts & Styles"
            >
              <Sparkles className="h-3.5 w-3.5 text-red-600 animate-spin-slow" />
              <span>Possible UIs (4)</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
