import React from 'react';
import { Brain, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Question } from '../types';

interface AnalyzingScreenProps {
  questions: Question[];
  currentProgress?: {
    completed: number;
    total: number;
  };
  error?: string | null;
  onRetry?: () => void;
  renderMode?: 'both' | 'left' | 'right';
}

export const AnalyzingScreen: React.FC<AnalyzingScreenProps> = ({
  questions,
  currentProgress,
  error,
  onRetry,
  renderMode = 'both',
}) => {
  // LEFT PAGE: Batch Assessment Checklist
  const leftPageContent = (
    <div className="space-y-4">
      <div className="pb-3 border-b border-stone-300/80">
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 block">
          Diagnostic Evaluation
        </span>
        <h2 className="text-lg font-serif font-bold text-stone-900">
          Reasoning Queue
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Gemini is listening to each question's audio waveform to detect step validity.
        </p>
      </div>

      <div className="space-y-2.5">
        {questions.map((q, idx) => {
          const isFinished = currentProgress && currentProgress.completed > idx;
          const isWorking = currentProgress && currentProgress.completed === idx;

          return (
            <div
              key={q.id}
              className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-white/90 shadow-2xs text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-800 font-bold flex items-center justify-center text-[10px]">
                  {idx + 1}
                </span>
                <span className="font-semibold text-stone-800 truncate max-w-[160px]">
                  {q.topic}: {q.lesson}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {isFinished ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Graded</span>
                  </span>
                ) : isWorking ? (
                  <span className="text-amber-700 font-semibold flex items-center gap-1 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    <span>Analyzing</span>
                  </span>
                ) : (
                  <span className="text-stone-400">In Queue</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-stone-600 leading-relaxed">
        <strong className="text-amber-950 font-bold">Independent Reasoning Check:</strong> The AI verifies whether your stated mathematical logic independently justifies the answer, regardless of whether the final digit matches.
      </div>
    </div>
  );

  // RIGHT PAGE: Multimodal AI Brain & Progress Waves
  const rightPageContent = (
    <div className="space-y-5 text-center flex flex-col justify-center h-full py-4">
      {/* Animated Brain Icon */}
      <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-900 text-amber-300 mx-auto shadow-md border-2 border-amber-400/40">
        <Brain className="w-8 h-8 text-amber-300 animate-pulse" />
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-1">
          Reviewing your reasoning…
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
          Gemini 2.5 Flash is inspecting your spoken thought process, separating mechanical slips from lucky guesses and true understanding.
        </p>
      </div>

      {/* Pulsing Audio Waves (only when active and no error) */}
      {!error ? (
        <div className="flex items-center justify-center gap-1.5 h-8">
          {[12, 24, 18, 30, 22, 14, 28, 16, 26, 12].map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-amber-500 rounded-full animate-pulse"
              style={{
                height: `${h}px`,
                animationDelay: `${i * 120}ms`,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-800 shadow-2xs space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="font-bold text-rose-950 text-sm">Gemini Analysis Error</div>
              <p className="text-rose-800 text-xs leading-relaxed">{error}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Retry Analysis with Gemini</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!error && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-600">
          <Sparkles className="w-3 h-3 text-amber-600" />
          <span>Multimodal audio grading in progress</span>
        </div>
      )}
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
