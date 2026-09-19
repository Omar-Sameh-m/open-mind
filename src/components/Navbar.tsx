import React from 'react';
import { Brain, BookOpen, RotateCcw } from 'lucide-react';

interface NavbarProps {
  currentScreen: 'start' | 'question' | 'analyzing' | 'review' | 'notes';
  onNavigateToStart: () => void;
  onNavigateToNotes: () => void;
  savedSessionsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigateToStart,
  onNavigateToNotes,
  savedSessionsCount,
}) => {
  return (
    <header className="w-full border-b border-stone-200 bg-stone-50/90 backdrop-blur-xs sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          id="nav-logo-btn"
          onClick={onNavigateToStart}
          className="flex items-center gap-2.5 text-stone-900 hover:text-stone-700 transition text-left cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-stone-50 flex items-center justify-center font-bold shadow-xs group-hover:bg-stone-800 transition">
            <Brain className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="font-semibold tracking-tight text-base text-stone-900 flex items-center gap-1.5">
              Open Mind
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                AI Tutor
              </span>
            </div>
            <div className="text-xs text-stone-500 font-normal">
              Checking reasoning, not just answers
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {currentScreen !== 'notes' && (
            <button
              id="nav-notes-btn"
              onClick={onNavigateToNotes}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-700 hover:text-stone-900 px-3 py-1.5 rounded-lg border border-stone-300 hover:border-stone-400 bg-white shadow-2xs transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-stone-600" />
              <span>Notes & Weak Topics</span>
              {savedSessionsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                  {savedSessionsCount}
                </span>
              )}
            </button>
          )}

          {currentScreen !== 'start' && currentScreen !== 'notes' && (
            <button
              id="nav-reset-btn"
              onClick={() => {
                if (window.confirm('Do you want to exit the current session?')) {
                  onNavigateToStart();
                }
              }}
              title="Restart session"
              className="p-2 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-200/60 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
