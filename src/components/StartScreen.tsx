import React from 'react';
import { ArrowRight, Mic, Sparkles, BookOpen, Brain, Lightbulb, Target, Compass, Award } from 'lucide-react';
import { ClassificationBadge, CLASSIFICATION_CONFIG } from './ClassificationBadge';

interface StartScreenProps {
  onStart: () => void;
  onViewNotes: () => void;
  savedSessionsCount: number;
  renderMode?: 'both' | 'left' | 'right';
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  onViewNotes,
  savedSessionsCount,
  renderMode = 'both',
}) => {
  // LEFT PAGE: Vintage Bookplate, Journal Rubric & Stamp Legend
  const leftPageContent = (
    <div className="space-y-4">
      {/* Vintage Bookplate */}
      <div className="p-3.5 rounded-xl border-2 border-dashed border-stone-400/80 bg-white/80 text-center shadow-2xs">
        <span className="text-[10px] font-mono tracking-widest uppercase text-stone-600 block">
          EX LIBRIS • REASONING FIELD JOURNAL
        </span>
        <h3 className="font-serif font-bold text-base text-stone-900 mt-1">
          Open Mind Cognitive Diagnostics
        </h3>
        <p className="text-[11px] text-stone-600 italic mt-0.5">
          Dedicated to catching how students think, not merely their final digits.
        </p>
      </div>

      {/* Rubric: 5 Evaluation Stamps */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block mb-2">
          Diagnostic Evaluation Stamps
        </span>
        <div className="space-y-2">
          {(
            [
              'solid_understanding',
              'careless_slip',
              'misconception',
              'lucky_guess',
              'unclear',
            ] as const
          ).map((key) => {
            const config = CLASSIFICATION_CONFIG[key];
            const Icon = config.icon;
            return (
              <div
                key={key}
                className="p-2 rounded-lg bg-white/90 border border-stone-200 flex items-start gap-2.5 shadow-2xs"
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${config.bgClass} ${config.textClass} border ${config.borderClass}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-stone-900 leading-tight">
                    {config.label}
                  </div>
                  <div className="text-[10px] text-stone-600 leading-tight mt-0.5">
                    {config.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multimodal Note */}
      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2 shadow-2xs">
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong>Multimodal Audio Evaluation:</strong> Gemini analyzes raw audio waveforms directly to detect authentic logical progression and pauses.
        </div>
      </div>
    </div>
  );

  // RIGHT PAGE: Title Frontispiece, Start Practice Button, Navigation
  const rightPageContent = (
    <div className="space-y-5 text-center flex flex-col justify-center h-full py-2">
      {/* Emblem */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-900 text-amber-300 mx-auto shadow-md border-2 border-amber-400/40">
        <Brain className="w-8 h-8 text-amber-300" />
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 mb-2">
          Open Mind
        </h1>
        <p className="text-base sm:text-lg text-stone-700 font-serif font-medium">
          We check <span className="underline decoration-amber-400 decoration-2 underline-offset-4 font-bold text-stone-950">why</span> you answered, not just what.
        </p>
      </div>

      {/* Description */}
      <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
        Standard quizzes only check your final numerical or multiple-choice answer. Open Mind listens to your spoken explanation using Gemini multimodal AI to separate true mastery from lucky guesses and hidden misconceptions.
      </p>

      {/* Buttons */}
      <div className="space-y-2.5 max-w-xs mx-auto w-full pt-2">
        <button
          id="start-practice-btn"
          onClick={onStart}
          className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-stone-900 text-white font-bold text-sm hover:bg-stone-800 transition shadow-sm hover:shadow active:scale-[0.98] cursor-pointer"
        >
          <span>Open Book & Start Practice</span>
          <ArrowRight className="w-4 h-4 text-amber-300" />
        </button>

        {savedSessionsCount > 0 && (
          <button
            id="view-past-notes-btn"
            onClick={onViewNotes}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-stone-300 bg-white/90 text-stone-700 font-semibold text-xs hover:bg-stone-100 transition shadow-2xs cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-stone-600" />
            <span>Flip to Past Notes Index ({savedSessionsCount})</span>
          </button>
        )}
      </div>

      {/* 3 Step summary strip */}
      <div className="pt-4 border-t border-stone-200/80 grid grid-cols-3 gap-2 text-[10px] text-stone-600">
        <div className="flex flex-col items-center gap-1">
          <Target className="w-3.5 h-3.5 text-stone-800" />
          <span className="font-semibold text-stone-900">1. Type Answer</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Mic className="w-3.5 h-3.5 text-amber-700" />
          <span className="font-semibold text-stone-900">2. Speak Steps</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-emerald-700" />
          <span className="font-semibold text-stone-900">3. Graded Stamp</span>
        </div>
      </div>
    </div>
  );

  if (renderMode === 'left') {
    return leftPageContent;
  }
  if (renderMode === 'right') {
    return rightPageContent;
  }

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-4 bg-[#faf8f5] rounded-xl border border-stone-200">{leftPageContent}</div>
      <div className="p-4 bg-[#faf8f5] rounded-xl border border-stone-200">{rightPageContent}</div>
    </div>
  );
};
