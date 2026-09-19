import React, { useState } from 'react';
import { AppData, Attempt, Session } from '../types';
import { ClassificationBadge, CLASSIFICATION_CONFIG } from './ClassificationBadge';
import { HighlightedText } from './HighlightedText';
import { STARTER_QUESTIONS } from '../data/starterQuestions';
import { speechService } from '../services/speechService';
import {
  Brain,
  Calendar,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Volume2,
  VolumeX,
  Sparkles,
  BarChart2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  AlertTriangle,
  Tag,
  BookOpen,
} from 'lucide-react';

interface NotesScreenProps {
  appData: AppData;
  onStartNewSession: () => void;
  onClearAll: () => void;
  renderMode?: 'both' | 'left' | 'right';
}

export const NotesScreen: React.FC<NotesScreenProps> = ({
  appData,
  onStartNewSession,
  onClearAll,
  renderMode = 'both',
}) => {
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);
  const [playingAttemptId, setPlayingAttemptId] = useState<string | null>(null);

  const sessions = appData.sessions || [];

  const getQuestion = (questionId: string) => {
    return STARTER_QUESTIONS.find((q) => q.id === questionId);
  };

  // Calculate stats & weak topic counts
  const weakTopicCounts: Record<string, number> = {};
  const misconceptionCounts: Record<
    string,
    { label: string; count: number; topics: string[] }
  > = {};

  let totalMisconceptions = 0;
  let totalLuckyGuesses = 0;
  let totalSolid = 0;
  let totalCareless = 0;
  let totalUnclear = 0;

  sessions.forEach((sess) => {
    sess.attempts.forEach((att) => {
      const q = getQuestion(att.questionId);
      const topic = q?.topic || 'General';

      if (att.classification === 'solid_understanding') totalSolid++;
      if (att.classification === 'careless_slip') totalCareless++;
      if (att.classification === 'unclear') totalUnclear++;
      if (att.classification === 'misconception') {
        totalMisconceptions++;
        weakTopicCounts[topic] = (weakTopicCounts[topic] || 0) + 1;
      }
      if (att.classification === 'lucky_guess') {
        totalLuckyGuesses++;
        weakTopicCounts[topic] = (weakTopicCounts[topic] || 0) + 1;
      }

      // A5: Aggregate Misconception Labels
      if (att.misconceptionLabel && att.misconceptionLabel.trim()) {
        const labelText = att.misconceptionLabel.trim();
        if (!misconceptionCounts[labelText]) {
          misconceptionCounts[labelText] = {
            label: labelText,
            count: 0,
            topics: [],
          };
        }
        misconceptionCounts[labelText].count += 1;
        if (!misconceptionCounts[labelText].topics.includes(topic)) {
          misconceptionCounts[labelText].topics.push(topic);
        }
      }
    });
  });

  const weakTopicsList = Object.entries(weakTopicCounts).map(([topic, count]) => ({
    topic,
    count,
  }));
  const maxWeakCount = Math.max(...weakTopicsList.map((t) => t.count), 1);

  // Sorted list of specific misconceptions by frequency
  const misconceptionList = Object.values(misconceptionCounts).sort(
    (a, b) => b.count - a.count
  );

  const handleToggleExpand = (attemptId: string) => {
    if (expandedAttemptId === attemptId) {
      setExpandedAttemptId(null);
      if (playingAttemptId === attemptId) {
        speechService.stop();
        setPlayingAttemptId(null);
      }
    } else {
      setExpandedAttemptId(attemptId);
    }
  };

  const handlePlayExplanation = (attempt: Attempt) => {
    if (playingAttemptId === attempt.id) {
      speechService.stop();
      setPlayingAttemptId(null);
      return;
    }

    setPlayingAttemptId(attempt.id);
    speechService.speak(attempt.explanation, {
      onStart: () => setPlayingAttemptId(attempt.id),
      onEnd: () => setPlayingAttemptId(null),
      onError: () => setPlayingAttemptId(null),
    });
  };

  // LEFT PAGE: Mastery Dashboard, Weak Topics Bar Chart & A5 Misconception Patterns
  const leftPageContent = (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-3 border-b border-stone-300/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 block">
            Notebook Index • Appendix
          </span>
          <h2 className="text-lg font-serif font-bold text-stone-900">
            Cognitive Diagnostics
          </h2>
        </div>
        {sessions.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Clear all practice sessions from this journal?')) {
                onClearAll();
              }
            }}
            title="Clear all stored sessions"
            className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stats Mini Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Solid</span>
          </div>
          <div className="text-xl font-bold text-emerald-950 font-mono mt-0.5">{totalSolid}</div>
          <div className="text-[9px] text-emerald-700">Mastery</div>
        </div>

        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
          <div className="text-[10px] font-bold uppercase text-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Slips</span>
          </div>
          <div className="text-xl font-bold text-amber-950 font-mono mt-0.5">{totalCareless}</div>
          <div className="text-[9px] text-amber-700">Careless</div>
        </div>

        <div className="p-2 rounded-xl bg-orange-50 border border-orange-200">
          <div className="text-[10px] font-bold uppercase text-orange-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Misconceptions</span>
          </div>
          <div className="text-xl font-bold text-orange-950 font-mono mt-0.5">{totalMisconceptions}</div>
          <div className="text-[9px] text-orange-700">Concept gaps</div>
        </div>

        <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
          <div className="text-[10px] font-bold uppercase text-rose-800 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Guesses</span>
          </div>
          <div className="text-xl font-bold text-rose-950 font-mono mt-0.5">{totalLuckyGuesses}</div>
          <div className="text-[9px] text-rose-700">Lucky guesses</div>
        </div>
      </div>

      {/* Weak Topics Bar Chart */}
      <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
            <BarChart2 className="w-3.5 h-3.5 text-stone-700" />
            <span>Weak Topics (Misconceptions & Lucky Guesses)</span>
          </div>
          <span className="text-[10px] text-stone-600">By Subject</span>
        </div>

        {weakTopicsList.length === 0 ? (
          <div className="text-center py-4 bg-stone-50 rounded-lg text-xs text-stone-500">
            No weak topics detected yet! Complete practice problems to build your analytics profile.
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            {weakTopicsList.map((item) => {
              const percentage = Math.round((item.count / maxWeakCount) * 100);
              return (
                <div key={item.topic} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className="text-stone-800">{item.topic}</span>
                    <span className="font-mono text-stone-500">{item.count} flagged</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(percentage, 10)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* A5: Aggregated Specific Misconception Labels */}
      <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
            <Tag className="w-3.5 h-3.5 text-amber-700" />
            <span>Recurring Misconceptions (A5 Aggregation)</span>
          </div>
          <span className="text-[10px] text-amber-800 font-medium">
            {misconceptionList.length} patterns
          </span>
        </div>

        {misconceptionList.length === 0 ? (
          <p className="text-[11px] text-stone-500 italic py-2">
            No recurring misconception patterns logged yet.
          </p>
        ) : (
          <div className="space-y-2 pt-1">
            {misconceptionList.map((item, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-white border border-amber-200/80 flex items-start justify-between gap-2 shadow-2xs"
              >
                <div>
                  <div className="text-xs font-semibold text-stone-900">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    Seen in: {item.topics.join(', ')}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono font-bold text-[11px] shrink-0 border border-amber-300">
                  {item.count}×
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action to Start New Practice */}
      <div className="pt-2">
        <button
          id="notes-start-new-session-btn"
          onClick={onStartNewSession}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition shadow-2xs cursor-pointer active:scale-95"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>Open Book to New Practice Session</span>
        </button>
      </div>
    </div>
  );

  // RIGHT PAGE: Chronological Diary of Graded Attempts with SpeechSynthesis Replay
  const rightPageContent = (
    <div className="space-y-4">
      {/* Session Diary Header */}
      <div className="pb-3 border-b border-stone-300/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 block">
            Chronological Log
          </span>
          <h2 className="text-lg font-serif font-bold text-stone-900">
            Session History Diary
          </h2>
        </div>
        <span className="text-xs font-medium text-stone-500 font-mono">
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
        </span>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-stone-200 shadow-2xs p-6">
          <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-stone-800">
            No entries in this journal yet
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
            Click the button on the left to start a 3-question practice session.
          </p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
          {sessions.map((session, sIdx) => {
            const dateStr = new Date(session.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={session.id || sIdx}
                className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-100">
                  <span className="font-semibold text-stone-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    <span>Session #{sessions.length - sIdx}</span>
                  </span>
                  <span className="text-stone-600 font-mono text-[11px]">{dateStr}</span>
                </div>

                {/* Problem Attempts in this session */}
                <div className="space-y-2">
                  {session.attempts.map((att, aIdx) => {
                    const q = getQuestion(att.questionId);
                    const isExpanded = expandedAttemptId === att.id;
                    const isPlaying = playingAttemptId === att.id;

                    return (
                      <div
                        key={att.id || aIdx}
                        className="rounded-lg border border-stone-200/80 bg-stone-50/50 overflow-hidden"
                      >
                        {/* Header Row */}
                        <div
                          onClick={() => handleToggleExpand(att.id)}
                          className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-stone-100/60 transition"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-xs font-bold text-stone-500 shrink-0">
                              Q{aIdx + 1}
                            </span>
                            <div className="truncate text-xs font-medium text-stone-900">
                              {q?.topic || 'Problem'}: {q?.lesson || ''}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <ClassificationBadge
                              classification={att.classification}
                              size="sm"
                              variant="badge"
                            />
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-stone-500" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                            )}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="p-3 border-t border-stone-200 bg-white space-y-2 text-xs">
                            {/* Question with highlight */}
                            <div>
                              <span className="text-[10px] font-bold uppercase text-stone-600 block">
                                Question
                              </span>
                              <div className="font-serif text-stone-800 mt-0.5 leading-relaxed">
                                <HighlightedText
                                  text={q?.text || ''}
                                  highlightText={att.highlightText}
                                />
                              </div>
                            </div>

                            {/* Answers */}
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-stone-600 font-semibold block">Your Answer:</span>
                                <span className="font-mono text-stone-900">{att.studentAnswer}</span>
                              </div>
                              <div>
                                <span className="text-stone-600 font-semibold block">Correct Answer:</span>
                                <span className="font-mono text-stone-900">{q?.correctAnswer}</span>
                              </div>
                            </div>

                            {/* Spoken reasoning */}
                            <div className="p-2 rounded bg-stone-50 border border-stone-200">
                              <span className="text-[10px] font-bold uppercase text-stone-600 block">
                                Spoken Transcript
                              </span>
                              <p className="italic text-stone-700 text-[11px] mt-0.5">
                                "{att.voiceTranscript || 'No audio transcript'}"
                              </p>
                            </div>

                            {/* Tutor explanation & audio replay */}
                            <div className="p-2.5 rounded bg-amber-50/60 border border-amber-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold uppercase text-amber-900 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  <span>Tutor Note</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayExplanation(att);
                                  }}
                                  className="text-[11px] font-semibold text-amber-900 hover:text-amber-950 flex items-center gap-1 underline"
                                >
                                  {isPlaying ? (
                                    <>
                                      <VolumeX className="w-3 h-3" />
                                      <span>Stop</span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-3 h-3" />
                                      <span>Play voice</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-[11px] text-stone-800 leading-relaxed">
                                {att.explanation}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
