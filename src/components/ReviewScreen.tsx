import React, { useState, useEffect } from 'react';
import { Attempt, Question } from '../types';
import { ClassificationBadge, CLASSIFICATION_CONFIG } from './ClassificationBadge';
import { HighlightedText } from './HighlightedText';
import { speechService } from '../services/speechService';
import {
  Volume2,
  VolumeX,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Quote,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Tag,
  FileCheck2,
} from 'lucide-react';

interface ReviewScreenProps {
  attempts: Attempt[];
  questions: Question[];
  onFinishAndSave: () => void;
  onRetryQuestion?: (questionId: string) => void;
  renderMode?: 'both' | 'left' | 'right';
  currentReviewIndex?: number;
  onSelectReviewIndex?: (index: number) => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  attempts,
  questions,
  onFinishAndSave,
  onRetryQuestion,
  renderMode = 'both',
  currentReviewIndex,
  onSelectReviewIndex,
}) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentIndex = currentReviewIndex !== undefined ? currentReviewIndex : internalIndex;
  const setCurrentIndex = (idx: number) => {
    if (onSelectReviewIndex) {
      onSelectReviewIndex(idx);
    } else {
      setInternalIndex(idx);
    }
  };

  const currentAttempt = attempts[currentIndex];
  const currentQuestion =
    questions.find((q) => q.id === currentAttempt?.questionId) || questions[currentIndex];

  // Stop speech when navigating or unmounting
  useEffect(() => {
    speechService.stop();
    setIsPlayingAudio(false);

    return () => {
      speechService.stop();
    };
  }, [currentIndex]);

  if (!currentAttempt || !currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">No attempts to display.</p>
        <button
          onClick={onFinishAndSave}
          className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-lg"
        >
          View Notes
        </button>
      </div>
    );
  }

  const isFinalAttempt = currentIndex === attempts.length - 1;

  const handlePlayExplanation = () => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    speechService.speak(currentAttempt.explanation, {
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  const handleNext = () => {
    speechService.stop();
    setIsPlayingAudio(false);
    if (isFinalAttempt) {
      onFinishAndSave();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    speechService.stop();
    setIsPlayingAudio(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const isAnswerCorrect =
    String(currentAttempt.studentAnswer).trim().toLowerCase() ===
    String(currentQuestion.correctAnswer).trim().toLowerCase();

  // LEFT PAGE: Diagnostic Overview, Problem List & Rubric Stamps
  const leftPageContent = (
    <div className="space-y-5">
      {/* Graded Session Assessment Header */}
      <div className="pb-3 border-b border-stone-300/80">
        <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
          <span className="font-serif italic font-semibold text-stone-700">Graded Report</span>
          <span className="font-mono text-stone-800">
            Problem {currentIndex + 1} of {attempts.length}
          </span>
        </div>
        <h2 className="text-lg font-serif font-bold text-stone-900">
          Reasoning Diagnostic Journal
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Comparing final answers with genuine conceptual understanding.
        </p>
      </div>

      {/* Problems List in this session */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
          Session Problems (Click to inspect)
        </span>
        <div className="space-y-1.5">
          {attempts.map((att, idx) => {
            const q = questions.find((item) => item.id === att.questionId) || questions[idx];
            const isSelected = idx === currentIndex;
            const conf = CLASSIFICATION_CONFIG[att.classification] || CLASSIFICATION_CONFIG.solid_understanding;
            const Icon = conf.icon;

            return (
              <button
                key={att.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs select-none ${
                  isSelected
                    ? 'bg-amber-50/80 border-amber-300 shadow-2xs'
                    : 'bg-white/90 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${conf.bgClass} ${conf.textClass}`}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-stone-900 mr-1.5">P{idx + 1}.</span>
                    <span className="text-stone-700">{q?.topic || 'Problem'}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <ClassificationBadge classification={att.classification} size="sm" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend / Key Stamp Explanation */}
      <div className="p-3.5 rounded-xl bg-white/70 border border-stone-200 text-[11px] text-stone-600 space-y-1.5 shadow-2xs">
        <div className="font-semibold text-stone-800 flex items-center gap-1">
          <FileCheck2 className="w-3.5 h-3.5 text-stone-500" />
          <span>Why this classification matters:</span>
        </div>
        <p className="leading-relaxed">
          {CLASSIFICATION_CONFIG[currentAttempt.classification]?.description}
        </p>
      </div>

      {/* Quick link to notes */}
      <div className="pt-2">
        <button
          onClick={onFinishAndSave}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 text-xs font-semibold hover:bg-stone-100 transition shadow-2xs cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-stone-600" />
          <span>Turn to Notebook Index (View All Notes)</span>
        </button>
      </div>
    </div>
  );

  // RIGHT PAGE: Detailed Graded Sheet with Rubber Stamp & Spoken Feedback
  const rightPageContent = (
    <div className="space-y-4">
      {/* Stamp & Misconception Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 block mb-1">
            Rubric Evaluation Stamp
          </span>
          {/* Notebook Rubber Stamp variant */}
          <ClassificationBadge
            classification={currentAttempt.classification}
            variant="stamp"
            size="lg"
          />
        </div>

        {currentAttempt.misconceptionLabel && (
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
              Identified Pattern
            </span>
            <span className="text-xs font-semibold text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-md border border-amber-300 inline-flex items-center gap-1 mt-0.5 shadow-2xs">
              <Tag className="w-3 h-3" />
              <span>{currentAttempt.misconceptionLabel}</span>
            </span>
          </div>
        )}
      </div>

      {/* Special Guidance if Unclear */}
      {currentAttempt.classification === 'unclear' && (
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sky-950">
              We couldn't quite catch your verbal reasoning
            </div>
            <p className="text-[11px] text-sky-800 mt-0.5">
              The audio was either very brief or did not detail the mathematical/programming steps taken.
            </p>
            {onRetryQuestion && (
              <button
                type="button"
                onClick={() => onRetryQuestion(currentQuestion.id)}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-sky-300 text-sky-900 rounded-lg font-semibold text-[11px] hover:bg-sky-100 transition shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry this question with microphone</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Highlighted Question Text */}
      <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1 flex items-center justify-between">
          <span>Question Statement</span>
          {currentAttempt.highlightText && (
            <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Key phrase highlighted
            </span>
          )}
        </div>
        <div className="text-sm sm:text-base font-serif font-medium text-stone-900 leading-relaxed">
          <HighlightedText
            text={currentQuestion.text}
            highlightText={currentAttempt.highlightText}
          />
        </div>
      </div>

      {/* Answer Comparison */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-2.5 rounded-xl border border-stone-200 bg-white/90 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-0.5">
            Your Final Answer
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-900">
            {isAnswerCorrect ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            )}
            <span>{currentAttempt.studentAnswer || '—'}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl border border-stone-200 bg-white/90 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-0.5">
            Correct Answer
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-900">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{currentQuestion.correctAnswer}</span>
          </div>
        </div>
      </div>

      {/* Student Spoken Transcript */}
      <div className="p-3 rounded-xl bg-stone-50/90 border border-stone-200 text-xs">
        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1 flex items-center gap-1">
          <Quote className="w-3 h-3 text-stone-500" />
          <span>What You Explained Aloud</span>
        </div>
        <p className="italic text-stone-700 leading-relaxed text-[11px] sm:text-xs">
          "{currentAttempt.voiceTranscript || 'No verbal audio recorded'}"
        </p>
      </div>

      {/* Tutor Explanation & Speech Synthesis audio button */}
      <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/90 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Tutor Spoken Feedback</span>
          </span>

          <button
            id="play-explanation-btn"
            type="button"
            onClick={handlePlayExplanation}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs ${
              isPlayingAudio
                ? 'bg-amber-500 text-stone-950 hover:bg-amber-600'
                : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-stone-950" />
                <span>Stop Speaking</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Listen to Tutor</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">
          {currentAttempt.explanation}
        </p>
      </div>

      {/* Review Navigation Buttons */}
      <div className="pt-2 flex items-center justify-between border-t border-stone-200">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            currentIndex === 0
              ? 'text-stone-300 cursor-not-allowed'
              : 'text-stone-700 hover:bg-stone-100 cursor-pointer'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous Problem</span>
        </button>

        <button
          id="review-next-btn"
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition shadow-2xs cursor-pointer active:scale-95"
        >
          <span>{isFinalAttempt ? 'Turn to Notebook Index' : 'Turn to Next Review'}</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
        </button>
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
