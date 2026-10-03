import React, { useState, useEffect } from 'react';
import { Bookmark, Play, Trash2, HelpCircle, ArrowRight, BookOpen } from 'lucide-react';
import { BookmarkItem } from '../types/quiz';
import { fetchBookmarks, toggleBookmark } from '../services/api';

interface BookmarksViewProps {
  onStartExam: (config: {
    title: string;
    mode: 'practice' | 'exam';
    count: number;
    durationMinutes: number;
    topicId?: string;
  }) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({ onStartExam }) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const data = await fetchBookmarks();
      setBookmarks(data.bookmarks);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (questionId: string) => {
    try {
      await toggleBookmark(questionId);
      setBookmarks(prev => prev.filter(b => b.questionId !== questionId));
    } catch (err) {
      console.error(err);
    }
  };

  const uniqueTopics = Array.from(new Set(bookmarks.map(b => b.topicName)));

  const filteredBookmarks = bookmarks.filter(b =>
    selectedTopic === 'all' ? true : b.topicName === selectedTopic
  );

  return (
    <div className="space-y-6 pb-20 sm:pb-16 bg-white text-red-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-red-200 pb-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-red-600 font-bold flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            <span>MADE BY ANANTH · SAVED DRILLS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-red-700 flex items-center space-x-2 mt-0.5">
            <Bookmark className="h-6 w-6 text-red-600 fill-red-600" />
            <span>Bookmarked Difficult Questions ({bookmarks.length})</span>
          </h1>
          <p className="text-xs sm:text-sm text-red-800/80 mt-1">
            Review questions you saved during tests and launch dedicated drills to reinforce concepts.
          </p>
        </div>

        {bookmarks.length > 0 && (
          <button
            onClick={() =>
              onStartExam({
                title: 'Bookmarked Questions Practice Drill',
                mode: 'practice',
                count: Math.min(bookmarks.length, 30),
                durationMinutes: Math.min(bookmarks.length, 30)
              })
            }
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 transition flex items-center space-x-2 cursor-pointer shrink-0 border border-red-500/30"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Practice Bookmarks Drill</span>
          </button>
        )}
      </div>

      {/* Filter by Topic */}
      {uniqueTopics.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-bold text-red-700">Filter Topic:</span>
          <button
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
              selectedTopic === 'all'
                ? 'bg-red-600 text-white border-red-600 font-bold shadow-2xs'
                : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
            }`}
          >
            All ({bookmarks.length})
          </button>
          {uniqueTopics.map(tName => (
            <button
              key={tName}
              onClick={() => setSelectedTopic(tName)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                selectedTopic === tName
                  ? 'bg-red-600 text-white border-red-600 font-bold shadow-2xs'
                  : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
              }`}
            >
              {tName}
            </button>
          ))}
        </div>
      )}

      {/* Bookmarks List */}
      {loading ? (
        <div className="text-center py-16 text-red-400 font-serif">
          Loading bookmarked questions...
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-red-200 p-8 space-y-3">
          <Bookmark className="h-10 w-10 text-red-400 mx-auto" />
          <h3 className="text-base font-serif font-bold text-red-700">No bookmarked questions yet</h3>
          <p className="text-xs text-red-600/80 max-w-sm mx-auto">
            Click the bookmark icon during practice or exams to save challenging questions for review here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookmarks.map((b, idx) => (
            <div
              key={b.questionId}
              className="bg-white rounded-2xl border border-red-200 p-5 sm:p-6 shadow-xs space-y-4 hover:border-red-400 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                    Bookmark #{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-red-700">{b.topicName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
                    {b.difficulty}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRemove(b.questionId)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-50 border border-red-200 transition cursor-pointer"
                    title="Remove from Bookmarks"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base font-serif font-medium text-red-800 leading-relaxed whitespace-pre-wrap">
                {b.questionText}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                {b.options.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isCorrect = optIdx === b.correctOption;

                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border flex items-center space-x-2.5 ${
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
                          ✓ Correct Key
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step-by-Step Explanation */}
              <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-red-600 flex items-center space-x-1.5">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Step-by-Step Mathematical Explanation</span>
                </div>
                <div className="text-xs sm:text-sm text-red-800 font-mono whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-red-200">
                  {b.explanation}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
