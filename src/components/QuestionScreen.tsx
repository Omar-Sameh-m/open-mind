import React, { useState, useRef, useEffect } from 'react';
import { Question } from '../types';
import { transcribeAudioWithGemini } from '../services/geminiService';
import {
  Mic,
  Square,
  RotateCcw,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Check,
  Edit3,
  Lightbulb,
  FileText,
  Loader2,
  Clock,
} from 'lucide-react';

/** Maximum recording duration in seconds. Keeps the base64 payload well under Vercel's ~4.5 MB body limit. */
const MAX_RECORDING_SECONDS = 60;

interface QuestionScreenProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  onNext: (studentAnswer: string, audioBlob: Blob | null, fallbackTranscript?: string) => void;
  // If rendering inside book spread:
  renderMode?: 'both' | 'left' | 'right';
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  currentIndex,
  totalQuestions,
  onNext,
  renderMode = 'both',
}) => {
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [fallbackReasoning, setFallbackReasoning] = useState('');
  const [useFallbackText, setUseFallbackText] = useState(false);
  const [autoStoppedAtLimit, setAutoStoppedAtLimit] = useState(false);

  // A4: Immediate Transcript Preview & Confirmation
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const answerInputRef = useRef<HTMLInputElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Reset state on question change
  useEffect(() => {
    setStudentAnswer('');
    setRecordedAudioBlob(null);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    setRecordingDuration(0);
    setIsRecording(false);
    setMicError(null);
    setFallbackReasoning('');
    setUseFallbackText(false);
    setAutoStoppedAtLimit(false);
    setSpokenTranscript('');
    setIsTranscribing(false);
    setIsEditingTranscript(false);

    // Auto focus answer input
    setTimeout(() => {
      answerInputRef.current?.focus();
    }, 120);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [question.id]);

  // Start audio recording with simultaneous Web Speech recognition
  const startRecording = async () => {
    setMicError(null);
    setSpokenTranscript('');
    chunksRef.current = [];

    try {
      // Check MediaRecorder API support before requesting mic permission so the
      // user sees a clear message upfront rather than an unexpected failure later.
      if (typeof MediaRecorder === 'undefined') {
        throw new Error(
          'Audio recording (MediaRecorder) is not supported in this browser. Please use Chrome, Firefox, or Edge.'
        );
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const fullBlob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedAudioBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setAudioPreviewUrl(url);

        // Stop all audio tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // If Web Speech API didn't catch transcript or was unsupported, request quick Gemini transcribe preview
        if (!spokenTranscript.trim()) {
          setIsTranscribing(true);
          try {
            const transcript = await transcribeAudioWithGemini(fullBlob);
            if (transcript) {
              setSpokenTranscript(transcript);
            }
          } catch (tErr) {
            console.warn('Live transcribe preview failed:', tErr);
          } finally {
            setIsTranscribing(false);
          }
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);
      setAutoStoppedAtLimit(false);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            // Auto-stop: hit the hard cap
            setAutoStoppedAtLimit(true);
            // Trigger stop on next tick so state is consistent
            setTimeout(() => {
              if (speechRecognitionRef.current) {
                try { speechRecognitionRef.current.stop(); } catch { /* ignore */ }
              }
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
              }
              setIsRecording(false);
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
            }, 0);
          }
          return next;
        });
      }, 1000);

      // Initialize live speech recognition for real-time text feedback (A4)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript + ' ';
            }
            setSpokenTranscript(current.trim());
          };

          recognition.onerror = () => {
            // Non-blocking, fallback to Gemini transcription on stop
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          // speech recognition not active
        }
      }
    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      setMicError(
        err?.message?.includes('Permission')
          ? 'Microphone permission was denied. You can type your verbal reasoning in the scratchpad below.'
          : 'Could not access microphone. You can type your verbal reasoning below.'
      );
      setUseFallbackText(true);
    }
  };

  const stopRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const reRecord = () => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    setRecordedAudioBlob(null);
    setSpokenTranscript('');
    setRecordingDuration(0);
    setIsEditingTranscript(false);
    startRecording();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const effectiveTranscript = spokenTranscript.trim() || fallbackReasoning.trim();
  const hasRecordedReasoning = !!recordedAudioBlob || (useFallbackText && fallbackReasoning.trim().length > 0);
  const isNextDisabled = !studentAnswer.trim() || !hasRecordedReasoning || isRecording;

  const handleNextClick = () => {
    if (isNextDisabled) return;
    onNext(
      studentAnswer.trim(),
      recordedAudioBlob,
      effectiveTranscript || undefined
    );
  };

  // Render question text with nice code formatting if C++ snippet
  const renderQuestionText = (text: string) => {
    const parts = text.split('\n');
    return (
      <div className="space-y-2.5">
        {parts.map((part, index) => {
          if (part.includes('for (') || part.includes('cout') || part.includes('int i')) {
            return (
              <pre
                key={index}
                className="bg-stone-900 text-amber-200 font-mono text-xs sm:text-sm p-3 rounded-lg border border-stone-800 overflow-x-auto shadow-inner"
              >
                <code>{part}</code>
              </pre>
            );
          }
          return (
            <p key={index} className="text-lg sm:text-xl font-medium text-stone-900 leading-snug font-serif">
              {part}
            </p>
          );
        })}
      </div>
    );
  };

  // LEFT PAGE: Notebook Journal Context, Rubric, and Scratchpad Guide
  const leftPageContent = (
    <div className="space-y-5">
      {/* Session tracker header */}
      <div className="pb-3 border-b border-stone-300/80">
        <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
          <span className="font-serif italic font-semibold text-stone-700">Practice Session</span>
          <span className="font-mono font-bold text-stone-800">
            Problem {currentIndex + 1} of {totalQuestions}
          </span>
        </div>
        <div className="text-sm font-semibold text-stone-900 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-800 text-xs font-mono">
            {question.topic}
          </span>
          <span className="text-stone-600 font-normal truncate">• {question.lesson}</span>
        </div>
      </div>

      {/* Spoken Reasoning Rubric */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2.5 shadow-2xs">
        <div className="font-semibold text-amber-950 flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-amber-600" />
          <span>How to explain your reasoning out loud:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-stone-700 pl-0.5 leading-relaxed">
          <li>
            <strong className="text-stone-900">Name the first operation:</strong> e.g.,{' '}
            <em>"I subtracted 6 from both sides to get 8..."</em>
          </li>
          <li>
            <strong className="text-stone-900">Explain the next step:</strong> e.g.,{' '}
            <em>"Then I divided 8 by 2 to isolate x..."</em>
          </li>
          <li>
            <strong className="text-stone-900">State your conclusion:</strong> e.g.,{' '}
            <em>"Which gives my final answer x = 4."</em>
          </li>
        </ol>
        <p className="text-[11px] text-amber-900/80 italic pt-1 border-t border-amber-200/60">
          Tip: Avoid just saying "it looks right" — Gemini evaluates step-by-step logic!
        </p>
      </div>

      {/* Progress Dots */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
          Session Progress
        </span>
        <div className="flex gap-2">
          {Array.from({ length: totalQuestions }).map((_, idx) => (
            <div
              key={idx}
              className={`h-2 flex-1 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-amber-500'
                  : idx < currentIndex
                  ? 'bg-stone-800'
                  : 'bg-stone-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Ruled scratchpad notes for mental calculations */}
      <div className="p-3.5 rounded-xl border border-stone-300/80 bg-stone-50/60 ruled-notebook text-xs text-stone-600">
        <div className="font-serif italic font-semibold text-stone-700 mb-1 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-stone-500" />
          <span>Student Scratchpad (Mental Check)</span>
        </div>
        <p className="text-[11px] text-stone-500 leading-6">
          Work through the problem in your mind or on paper first, type your final answer on the right, and then press record to speak your steps.
        </p>
      </div>
    </div>
  );

  // RIGHT PAGE: Interactive Question, Answer Input, Voice Recorder & Transcript Preview
  const rightPageContent = (
    <div className="space-y-5">
      {/* Question Text */}
      <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block mb-1.5">
          Question
        </span>
        {renderQuestionText(question.text)}
      </div>

      {/* Step 1: Student Typed Answer */}
      <div>
        <label
          htmlFor="student-answer-input"
          className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5"
        >
          1. Your Final Answer
        </label>
        <input
          id="student-answer-input"
          ref={answerInputRef}
          type="text"
          value={studentAnswer}
          onChange={(e) => setStudentAnswer(e.target.value)}
          placeholder="e.g. 4, 10, or 246"
          className="w-full px-3.5 py-2.5 text-base font-semibold text-stone-900 placeholder:text-stone-400 bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs transition"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isRecording && !hasRecordedReasoning) {
              startRecording();
            }
          }}
        />
      </div>

      {/* Step 2: Voice Reasoning Input */}
      <div className="pt-3 border-t border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-amber-700" />
            <span>2. Spoken Reasoning (Required)</span>
          </label>
          <span className="text-[11px] text-stone-600">
            Explain steps aloud
          </span>
        </div>

        {/* Not recorded yet */}
        {!recordedAudioBlob && !useFallbackText && (
          <div className="bg-white border border-stone-300 rounded-xl p-4 flex flex-col items-center text-center shadow-2xs">
            {!isRecording ? (
              <>
                <button
                  id="record-reasoning-btn"
                  type="button"
                  onClick={startRecording}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-stone-950" />
                  <span>Record Spoken Reasoning</span>
                </button>
                <p className="text-[11px] text-stone-500 mt-2 max-w-xs">
                  Click to speak your step-by-step logic into the microphone.
                </p>
              </>
            ) : (
              <div className="w-full flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                  </span>
                  <span className="text-xs font-bold text-rose-700">
                    Recording live... {formatDuration(recordingDuration)}
                  </span>
                  <span className="text-xs text-stone-500">
                    / {formatDuration(MAX_RECORDING_SECONDS)}
                  </span>
                </div>

                {/* Recording progress bar */}
                <div className="w-full mb-2">
                  <div className="w-full h-1.5 rounded-full bg-stone-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        recordingDuration >= MAX_RECORDING_SECONDS * 0.8
                          ? 'bg-rose-500'
                          : recordingDuration >= MAX_RECORDING_SECONDS * 0.6
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min((recordingDuration / MAX_RECORDING_SECONDS) * 100, 100)}%` }}
                    />
                  </div>
                  {recordingDuration >= MAX_RECORDING_SECONDS * 0.8 && (
                    <p className="text-[10px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {MAX_RECORDING_SECONDS - recordingDuration}s remaining — wrap up!
                    </p>
                  )}
                </div>

                {/* Animated sound bars */}
                <div className="flex items-center gap-1 h-5 mb-3">
                  {[10, 18, 14, 22, 16, 12, 20, 8, 16].map((height, i) => (
                    <div
                      key={i}
                      className="w-1 bg-rose-500 rounded-full animate-pulse"
                      style={{
                        height: `${height}px`,
                        animationDelay: `${i * 90}ms`,
                      }}
                    />
                  ))}
                </div>

                {/* Live Speech Recognition snippet if available */}
                {spokenTranscript && (
                  <div className="w-full p-2 mb-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 italic text-left max-h-16 overflow-y-auto">
                    "{spokenTranscript}"
                  </div>
                )}

                <button
                  id="stop-recording-btn"
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Stop & Review Transcript</span>
                </button>
              </div>
            )}

            {/* Mic error notice */}
            {micError && (
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-1.5 text-left w-full">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>{micError}</div>
              </div>
            )}

            {!isRecording && (
              <button
                type="button"
                onClick={() => setUseFallbackText(true)}
                className="mt-2.5 text-[11px] text-stone-600 hover:text-stone-800 underline transition cursor-pointer"
              >
                No microphone available? Type your verbal reasoning
              </button>
            )}
          </div>
        )}

        {/* Auto-stop banner */}
        {autoStoppedAtLimit && recordedAudioBlob && (
          <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-1.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Recording auto-stopped at {MAX_RECORDING_SECONDS}s</span> — the maximum limit was reached to keep the upload size manageable. Your audio has been saved.
            </div>
          </div>
        )}

        {/* A4: Recorded Audio Completed State with Instant Transcript Preview */}
        {recordedAudioBlob && !useFallbackText && (
          <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-200 border border-emerald-400 flex items-center justify-center text-emerald-900 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    Reasoning recorded ({formatDuration(recordingDuration)})
                  </div>
                  <div className="text-[10px] text-emerald-700">
                    Ready for Gemini multimodal evaluation
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {audioPreviewUrl && (
                  <audio src={audioPreviewUrl} controls className="h-7 max-w-[130px] sm:max-w-[160px]" />
                )}
                <button
                  type="button"
                  onClick={reRecord}
                  className="p-1.5 text-stone-700 hover:text-stone-950 bg-white border border-stone-300 rounded-lg transition shadow-2xs cursor-pointer"
                  title="Re-record your audio"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* A4: Transcript feedback box before analysis */}
            <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-xs text-stone-800">
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 mb-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Transcript Preview (What Gemini will analyze):</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                  className="text-stone-500 hover:text-stone-800 flex items-center gap-1 underline"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>{isEditingTranscript ? 'Done' : 'Edit text'}</span>
                </button>
              </div>

              {isTranscribing ? (
                <div className="flex items-center gap-2 text-stone-500 py-1 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                  <span>Transcribing spoken audio preview...</span>
                </div>
              ) : isEditingTranscript ? (
                <textarea
                  value={spokenTranscript}
                  onChange={(e) => setSpokenTranscript(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  rows={2}
                  placeholder="Review or refine your spoken words..."
                />
              ) : (
                <p className="italic text-stone-700 leading-relaxed">
                  "{spokenTranscript || 'Audio recorded. Gemini will perform direct multimodal transcription.'}"
                </p>
              )}
            </div>
          </div>
        )}

        {/* Fallback Text Input */}
        {useFallbackText && (
          <div className="bg-white border border-stone-300 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">
                Typed Spoken Reasoning (Microphone Backup)
              </span>
              <button
                type="button"
                onClick={() => setUseFallbackText(false)}
                className="text-[11px] text-stone-500 hover:text-stone-800 underline"
              >
                Use microphone instead
              </button>
            </div>
            <textarea
              value={fallbackReasoning}
              onChange={(e) => setFallbackReasoning(e.target.value)}
              placeholder="Explain the steps you took, why you chose this answer, and which mathematical rule applies..."
              rows={3}
              className="w-full p-2.5 text-xs text-stone-800 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>
        )}
      </div>

      {/* Turn Page / Next Question Button */}
      <div className="pt-2 flex items-center justify-between border-t border-stone-200">
        <span className="text-[11px] text-stone-500">
          {!studentAnswer.trim()
            ? 'Type your final answer'
            : !hasRecordedReasoning
            ? 'Record your reasoning to continue'
            : 'Page complete'}
        </span>

        <button
          id="question-next-btn"
          type="button"
          disabled={isNextDisabled}
          onClick={handleNextClick}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer ${
            isNextDisabled
              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
              : 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98]'
          }`}
        >
          <span>{currentIndex === totalQuestions - 1 ? 'Turn Page & Analyze' : 'Turn Page (Next Problem)'}</span>
          <ArrowRight className="w-4 h-4 text-amber-300" />
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
