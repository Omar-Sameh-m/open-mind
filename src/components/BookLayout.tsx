import React, { useState } from 'react';
import { BookOpen, Sparkles, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';

export type BookTab = 'cover' | 'practice' | 'review' | 'notes';

interface BookLayoutProps {
  currentTab: BookTab;
  onTabChange: (tab: BookTab) => void;
  leftPage: React.ReactNode;
  rightPage: React.ReactNode;
  pageNumberLeft?: number | string;
  pageNumberRight?: number | string;
  canFlipPrev?: boolean;
  canFlipNext?: boolean;
  onFlipPrev?: () => void;
  onFlipNext?: () => void;
  nextButtonLabel?: string;
  isFlipping?: boolean;
  flipDirection?: 'next' | 'prev';
}

export const BookLayout: React.FC<BookLayoutProps> = ({
  currentTab,
  onTabChange,
  leftPage,
  rightPage,
  pageNumberLeft,
  pageNumberRight,
  canFlipPrev = false,
  canFlipNext = false,
  onFlipPrev,
  onFlipNext,
  nextButtonLabel = 'Turn Page',
  isFlipping = false,
  flipDirection = 'next',
}) => {
  const [activeMobilePage, setActiveMobilePage] = useState<'left' | 'right'>('right');

  const tabs: { id: BookTab; label: string; icon: string; color: string }[] = [
    { id: 'cover', label: 'Cover', icon: '📖', color: 'bg-amber-700 text-amber-100 hover:bg-amber-800' },
    { id: 'practice', label: 'Practice', icon: '✏️', color: 'bg-stone-800 text-stone-100 hover:bg-stone-900' },
    { id: 'review', label: 'Review', icon: '🏷️', color: 'bg-emerald-800 text-emerald-100 hover:bg-emerald-900' },
    { id: 'notes', label: 'Notes Index', icon: '📊', color: 'bg-indigo-800 text-indigo-100 hover:bg-indigo-900' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-4 sm:py-8 px-2 sm:px-6 flex flex-col items-center">
      {/* Top Leather Binder & Bookmark Ribbons */}
      <div className="w-full max-w-5xl flex items-end justify-between px-4 sm:px-8 mb-1">
        {/* Book Title Embossing */}
        <div className="flex items-center gap-2 text-stone-700 font-serif font-bold text-xs sm:text-sm tracking-wide">
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span className="hidden sm:inline">Open Mind • Reasoning Field Journal</span>
          <span className="sm:hidden">Open Mind</span>
        </div>

        {/* Tactile Bookmark Tabs hanging off the top edge */}
        <div className="flex items-end gap-1.5 sm:gap-2">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative px-2.5 sm:px-3.5 py-1.5 rounded-t-lg text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer shadow-xs select-none flex items-center gap-1 sm:gap-1.5 ${
                  isActive
                    ? `${tab.color} -translate-y-1 shadow-md border-t-2 border-amber-300 font-bold`
                    : 'bg-stone-300/80 text-stone-700 hover:bg-stone-300 hover:-translate-y-0.5'
                }`}
                title={`Jump to ${tab.label}`}
              >
                <span>{tab.icon}</span>
                <span className="hidden md:inline text-[11px]">{tab.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse hidden sm:inline" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 3D Book Container */}
      <div className="perspective-book w-full max-w-5xl relative">
        {/* Hardcover Outer Leather Edge */}
        <div className="relative rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 shadow-2xl border-4 border-stone-800/80">
          
          {/* Subtle leather texture stitch border */}
          <div className="absolute inset-1 sm:inset-2 rounded-xl sm:rounded-2xl border border-dashed border-stone-700/60 pointer-events-none" />

          {/* Spine Crease / Hinge Indentations (Top and Bottom brass corners) */}
          <div className="absolute -top-1 left-4 w-4 h-4 rounded-tl-sm bg-gradient-to-br from-amber-300 to-amber-700 opacity-70 pointer-events-none" />
          <div className="absolute -top-1 right-4 w-4 h-4 rounded-tr-sm bg-gradient-to-bl from-amber-300 to-amber-700 opacity-70 pointer-events-none" />
          <div className="absolute -bottom-1 left-4 w-4 h-4 rounded-bl-sm bg-gradient-to-tr from-amber-300 to-amber-700 opacity-70 pointer-events-none" />
          <div className="absolute -bottom-1 right-4 w-4 h-4 rounded-br-sm bg-gradient-to-tl from-amber-300 to-amber-700 opacity-70 pointer-events-none" />

          {/* Desktop Two-Page Spread / Mobile Single-Page Spread */}
          <div className="relative flex flex-col md:flex-row min-h-[580px] sm:min-h-[640px] rounded-xl sm:rounded-2xl overflow-hidden bg-[#faf8f5] shadow-inner preserve-3d">
            
            {/* LEFT PAGE (hidden on mobile if mobile page is 'right') */}
            <div
              className={`w-full md:w-1/2 p-5 sm:p-8 flex flex-col justify-between paper-page paper-left relative border-b md:border-b-0 md:border-r border-stone-300/70 ${
                activeMobilePage === 'right' ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="flex-1 overflow-y-auto pr-1">
                {leftPage}
              </div>

              {/* Left Page Number & Footer */}
              <div className="pt-4 mt-4 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-600 select-none">
                <span className="font-serif italic text-stone-600">Open Mind Field Notes</span>
                <span className="font-mono font-medium">{pageNumberLeft !== undefined ? pageNumberLeft : ''}</span>
              </div>
            </div>

            {/* Central Book Spine & Seam Shadow (Desktop only) */}
            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 book-spine-seam z-20 pointer-events-none" />

            {/* RIGHT PAGE (the primary interactive workspace) */}
            <div
              className={`w-full md:w-1/2 p-5 sm:p-8 flex flex-col justify-between paper-page paper-right relative preserve-3d ${
                isFlipping
                  ? flipDirection === 'next'
                    ? 'animate-page-flip-next z-30'
                    : 'animate-page-flip-prev z-30'
                  : 'z-10'
              } ${activeMobilePage === 'left' ? 'hidden md:flex' : 'flex'}`}
            >
              {/* Dynamic paper lighting reflection during page rotation */}
              {isFlipping && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none z-40 transition-opacity" />
              )}

              <div className="flex-1 overflow-y-auto pr-1">
                {rightPage}
              </div>

              {/* Right Page Number & Footer */}
              <div className="pt-4 mt-4 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-600 select-none">
                <span className="font-mono font-medium">{pageNumberRight !== undefined ? pageNumberRight : ''}</span>
                <span className="font-serif italic text-stone-600">Gemini Multimodal Reasoning</span>
              </div>
            </div>

          </div>

          {/* Book Bottom Bookmark Ribbon */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3 w-4 h-12 bg-amber-600 shadow-md rounded-b-sm border-x border-amber-800 pointer-events-none hidden sm:block">
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-amber-900 clip-path-ribbon" />
          </div>
        </div>

        {/* Mobile Page Switcher (Allows switching between left and right pages on small phones) */}
        <div className="flex md:hidden items-center justify-center gap-2 mt-3 text-xs">
          <button
            onClick={() => setActiveMobilePage('left')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              activeMobilePage === 'left'
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-700 border-stone-300'
            }`}
          >
            Show Notes / Guide (Left Page)
          </button>
          <button
            onClick={() => setActiveMobilePage('right')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              activeMobilePage === 'right'
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-700 border-stone-300'
            }`}
          >
            Show Practice / Work (Right Page)
          </button>
        </div>

        {/* External Flip Controls Bar */}
        <div className="flex items-center justify-between mt-4 px-2 select-none">
          <div>
            {canFlipPrev && onFlipPrev && (
              <button
                id="book-flip-prev-btn"
                onClick={onFlipPrev}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/90 border border-stone-300 text-stone-700 hover:bg-stone-100 hover:border-stone-400 text-xs sm:text-sm font-medium transition cursor-pointer shadow-xs active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Flip Back</span>
              </button>
            )}
          </div>

          <div className="text-xs text-stone-600 font-medium">
            <span>Tip: Turning pages saves your entries to the notebook</span>
          </div>

          <div>
            {canFlipNext && onFlipNext && (
              <button
                id="book-flip-next-btn"
                onClick={onFlipNext}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-medium transition cursor-pointer shadow-xs active:scale-95"
              >
                <span>{nextButtonLabel}</span>
                <ChevronRight className="w-4 h-4 text-amber-300" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
