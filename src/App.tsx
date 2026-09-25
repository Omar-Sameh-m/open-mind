import React, { useState, useEffect } from 'react';
import { AppData, Attempt, Question, Session } from './types';
import { STARTER_QUESTIONS } from './data/starterQuestions';
import { loadAppData, saveSession, clearAllSessions, saveInProgress, loadInProgress, clearInProgress } from './services/storage';

import { analyzeAttemptWithGemini } from './services/geminiService';
import { speechService } from './services/speechService';
import { Navbar } from './components/Navbar';
import { BookLayout, BookTab } from './components/BookLayout';
import { StartScreen } from './components/StartScreen';
import { QuestionScreen } from './components/QuestionScreen';
import { AnalyzingScreen } from './components/AnalyzingScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { NotesScreen } from './components/NotesScreen';

type Screen = 'start' | 'question' | 'analyzing' | 'review' | 'notes';

interface PendingAttempt {
  question: Question;
  studentAnswer: string;
  audioBlob: Blob | null;
  fallbackTranscript?: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('start');
  const [appData, setAppData] = useState<AppData>({ sessions: [] });

  // Current session batch state
  const [batchQuestions, setBatchQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [pendingAttempts, setPendingAttempts] = useState<PendingAttempt[]>([]);

  // Analyzing state
  const [analyzingProgress, setAnalyzingProgress] = useState<{ completed: number; total: number }>({
    completed: 0,
    total: 0,
  });
  const [analyzingError, setAnalyzingError] = useState<string | null>(null);

  // Completed attempts for review
  const [completedAttempts, setCompletedAttempts] = useState<Attempt[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // 3D Page Flip Animation State
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');

  // Load saved data on startup; also restore any in-progress session
  useEffect(() => {
    const data = loadAppData();
    setAppData(data);

    const inProgress = loadInProgress();
    if (inProgress) {
      setBatchQuestions(inProgress.batchQuestions);
      setCompletedAttempts(inProgress.completedAttempts);
      // Resume at the question after the last completed one
      const nextIdx = inProgress.completedAttempts.length;
      if (nextIdx < inProgress.batchQuestions.length) {
        setCurrentQuestionIndex(nextIdx);
        setCurrentScreen('question');
      } else {
        // All questions answered — go to review
        setCurrentReviewIndex(0);
        setCurrentScreen('review');
      }
    }
  }, []);

  // Persist in-progress state whenever the batch or completed attempts change
  useEffect(() => {
    if (batchQuestions.length > 0) {
      saveInProgress({ batchQuestions, completedAttempts });
    }
  }, [batchQuestions, completedAttempts]);

  // Stop any ongoing SpeechSynthesis when switching screens
  useEffect(() => {
    speechService.stop();
  }, [currentScreen]);

  // Execute a tactile 3D page flip animation
  const triggerFlip = (direction: 'next' | 'prev', callback: () => void) => {
    if (isFlipping) return;
    setFlipDirection(direction);
    setIsFlipping(true);

    setTimeout(() => {
      callback();
      setTimeout(() => {
        setIsFlipping(false);
      }, 100);
    }, 380);
  };

  // Start a new 3-question practice session
  const handleStartSession = () => {
    const shuffled = [...STARTER_QUESTIONS].sort(() => 0.5 - Math.random());
    const selectedBatch = shuffled.slice(0, 3);

    triggerFlip('next', () => {
      setBatchQuestions(selectedBatch);
      setCurrentQuestionIndex(0);
      setPendingAttempts([]);
      setCompletedAttempts([]);
      setCurrentReviewIndex(0);
      setAnalyzingError(null);
      // Clear any previous in-progress session so the new batch starts fresh
      clearInProgress();
      setCurrentScreen('question');
    });
  };

  // Retry a specific question (e.g. if marked "unclear")
  const handleRetryQuestion = (questionId: string) => {
    const targetQ = STARTER_QUESTIONS.find((q) => q.id === questionId) || batchQuestions[0];
    triggerFlip('prev', () => {
      setBatchQuestions([targetQ]);
      setCurrentQuestionIndex(0);
      setPendingAttempts([]);
      setCurrentScreen('question');
    });
  };

  // Student completes one question in the batch
  const handleQuestionNext = (
    studentAnswer: string,
    audioBlob: Blob | null,
    fallbackTranscript?: string
  ) => {
    const currentQ = batchQuestions[currentQuestionIndex];
    const newPending: PendingAttempt = {
      question: currentQ,
      studentAnswer,
      audioBlob,
      fallbackTranscript,
    };

    const updatedPending = [...pendingAttempts, newPending];
    setPendingAttempts(updatedPending);

    if (currentQuestionIndex < batchQuestions.length - 1) {
      triggerFlip('next', () => {
        setCurrentQuestionIndex((prev) => prev + 1);
      });
    } else {
      triggerFlip('next', () => {
        runBatchAnalysis(updatedPending);
      });
    }
  };

  // Run Gemini API calls sequentially for smooth progress and rate-limit prevention
  const runBatchAnalysis = async (items: PendingAttempt[]) => {
    setCurrentScreen('analyzing');
    setAnalyzingProgress({ completed: 0, total: items.length });
    setAnalyzingError(null);

    try {
      const analyzedAttempts: Attempt[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const analysis = await analyzeAttemptWithGemini(
          item.question,
          item.studentAnswer,
          item.audioBlob,
          item.fallbackTranscript
        );

        analyzedAttempts.push({
          id: `att-${Date.now()}-${i}`,
          questionId: item.question.id,
          studentAnswer: item.studentAnswer,
          voiceTranscript: analysis.transcript,
          classification: analysis.classification,
          misconceptionLabel: analysis.misconceptionLabel,
          explanation: analysis.explanation,
          highlightText: analysis.highlightText,
          timestamp: new Date().toISOString(),
        });

        setAnalyzingProgress({
          completed: i + 1,
          total: items.length,
        });
      }

      setCompletedAttempts(analyzedAttempts);
      setCurrentReviewIndex(0);

      // Turn page into Review
      triggerFlip('next', () => {
        setCurrentScreen('review');
      });
    } catch (err: any) {
      console.error('Batch analysis error:', err);
      setAnalyzingError(err?.message || 'Gemini analysis failed. Please check your connection and retry.');
    }
  };

  // Save session and view Notes screen
  const handleFinishAndSave = () => {
    if (completedAttempts.length > 0) {
      const newSession: Session = {
        id: `session-${Date.now()}`,
        timestamp: new Date().toISOString(),
        attempts: completedAttempts,
      };

      const updated = saveSession(newSession);
      setAppData(updated);
    }
    // Session is now finalized — clear the in-progress draft
    clearInProgress();
    triggerFlip('next', () => {
      setCurrentScreen('notes');
    });
  };

  // Clear all saved notes
  const handleClearAll = () => {
    clearAllSessions();
    setAppData({ sessions: [] });
  };

  // Determine active book bookmark tab
  const getActiveTab = (): BookTab => {
    switch (currentScreen) {
      case 'start':
        return 'cover';
      case 'question':
      case 'analyzing':
        return 'practice';
      case 'review':
        return 'review';
      case 'notes':
        return 'notes';
      default:
        // Exhaustiveness guard: if a new Screen value is added, TypeScript
        // will surface this as an unreachable-code warning.
        return 'cover';
    }
  };

  // Handle ribbon bookmark click
  const handleTabChange = (tab: BookTab) => {
    if (tab === 'cover') {
      triggerFlip('prev', () => setCurrentScreen('start'));
    } else if (tab === 'practice') {
      if (currentScreen === 'question' || currentScreen === 'analyzing') {
        // already on practice
      } else {
        handleStartSession();
      }
    } else if (tab === 'review') {
      if (completedAttempts.length > 0) {
        triggerFlip('next', () => setCurrentScreen('review'));
      } else {
        // if no current review, start practice or go to notes
        triggerFlip('next', () => setCurrentScreen('notes'));
      }
    } else if (tab === 'notes') {
      triggerFlip('next', () => setCurrentScreen('notes'));
    }
  };

  // Determine flip control availability
  let canFlipPrev = false;
  let canFlipNext = false;
  let onFlipPrev: (() => void) | undefined = undefined;
  let onFlipNext: (() => void) | undefined = undefined;
  let nextButtonLabel = 'Turn Page';
  let pageNumberLeft: number | string = 'i';
  let pageNumberRight: number | string = 'ii';

  if (currentScreen === 'start') {
    canFlipNext = true;
    onFlipNext = handleStartSession;
    nextButtonLabel = 'Open Book to Practice';
    pageNumberLeft = 'Cover • i';
    pageNumberRight = 'Cover • ii';
  } else if (currentScreen === 'question') {
    if (currentQuestionIndex > 0) {
      canFlipPrev = true;
      onFlipPrev = () => {
        triggerFlip('prev', () => setCurrentQuestionIndex((prev) => prev - 1));
      };
    } else {
      canFlipPrev = true;
      onFlipPrev = () => {
        triggerFlip('prev', () => setCurrentScreen('start'));
      };
    }
    pageNumberLeft = `Practice • P${currentQuestionIndex + 1}`;
    pageNumberRight = `Worksheet • ${currentQuestionIndex + 1}`;
  } else if (currentScreen === 'review') {
    if (currentReviewIndex > 0) {
      canFlipPrev = true;
      onFlipPrev = () => {
        triggerFlip('prev', () => setCurrentReviewIndex((prev) => prev - 1));
      };
    }
    canFlipNext = true;
    if (currentReviewIndex < completedAttempts.length - 1) {
      onFlipNext = () => {
        triggerFlip('next', () => setCurrentReviewIndex((prev) => prev + 1));
      };
      nextButtonLabel = 'Next Graded Problem';
    } else {
      onFlipNext = handleFinishAndSave;
      nextButtonLabel = 'Save to Notes Index';
    }
    pageNumberLeft = `Diagnosis • P${currentReviewIndex + 1}`;
    pageNumberRight = `Graded Sheet • ${currentReviewIndex + 1}`;
  } else if (currentScreen === 'notes') {
    canFlipPrev = true;
    onFlipPrev = () => {
      triggerFlip('prev', () => setCurrentScreen('start'));
    };
    canFlipNext = true;
    onFlipNext = handleStartSession;
    nextButtonLabel = 'New Practice Batch';
    pageNumberLeft = 'Index • Analytics';
    pageNumberRight = 'Index • Session Log';
  }

  // Render left and right page contents
  const renderLeftPage = () => {
    switch (currentScreen) {
      case 'start':
        return (
          <StartScreen
            renderMode="left"
            onStart={handleStartSession}
            onViewNotes={() => setCurrentScreen('notes')}
            savedSessionsCount={appData.sessions.length}
          />
        );
      case 'question':
        return batchQuestions[currentQuestionIndex] ? (
          <QuestionScreen
            renderMode="left"
            question={batchQuestions[currentQuestionIndex]}
            currentIndex={currentQuestionIndex}
            totalQuestions={batchQuestions.length}
            onNext={handleQuestionNext}
          />
        ) : null;
      case 'analyzing':
        return (
          <AnalyzingScreen
            renderMode="left"
            questions={batchQuestions}
            currentProgress={analyzingProgress}
            error={analyzingError}
            onRetry={() => runBatchAnalysis(pendingAttempts)}
          />
        );
      case 'review':
        return (
          <ReviewScreen
            renderMode="left"
            attempts={completedAttempts}
            questions={batchQuestions}
            currentReviewIndex={currentReviewIndex}
            onSelectReviewIndex={(idx) => {
              triggerFlip('next', () => setCurrentReviewIndex(idx));
            }}
            onFinishAndSave={handleFinishAndSave}
            onRetryQuestion={handleRetryQuestion}
          />
        );
      case 'notes':
        return (
          <NotesScreen
            renderMode="left"
            appData={appData}
            onStartNewSession={handleStartSession}
            onClearAll={handleClearAll}
          />
        );
    }
  };

  const renderRightPage = () => {
    switch (currentScreen) {
      case 'start':
        return (
          <StartScreen
            renderMode="right"
            onStart={handleStartSession}
            onViewNotes={() => setCurrentScreen('notes')}
            savedSessionsCount={appData.sessions.length}
          />
        );
      case 'question':
        return batchQuestions[currentQuestionIndex] ? (
          <QuestionScreen
            renderMode="right"
            question={batchQuestions[currentQuestionIndex]}
            currentIndex={currentQuestionIndex}
            totalQuestions={batchQuestions.length}
            onNext={handleQuestionNext}
          />
        ) : null;
      case 'analyzing':
        return (
          <AnalyzingScreen
            renderMode="right"
            questions={batchQuestions}
            currentProgress={analyzingProgress}
            error={analyzingError}
            onRetry={() => runBatchAnalysis(pendingAttempts)}
          />
        );
      case 'review':
        return (
          <ReviewScreen
            renderMode="right"
            attempts={completedAttempts}
            questions={batchQuestions}
            currentReviewIndex={currentReviewIndex}
            onSelectReviewIndex={(idx) => {
              triggerFlip('next', () => setCurrentReviewIndex(idx));
            }}
            onFinishAndSave={handleFinishAndSave}
            onRetryQuestion={handleRetryQuestion}
          />
        );
      case 'notes':
        return (
          <NotesScreen
            renderMode="right"
            appData={appData}
            onStartNewSession={handleStartSession}
            onClearAll={handleClearAll}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-stone-200/70 text-stone-900 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-950">
      {/* Top Navigation */}
      <Navbar
        currentScreen={currentScreen}
        onNavigateToStart={() => triggerFlip('prev', () => setCurrentScreen('start'))}
        onNavigateToNotes={() => triggerFlip('next', () => setCurrentScreen('notes'))}
        savedSessionsCount={appData.sessions.length}
      />

      {/* Main 3D Book Layout Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 w-full">
        <BookLayout
          currentTab={getActiveTab()}
          onTabChange={handleTabChange}
          leftPage={renderLeftPage()}
          rightPage={renderRightPage()}
          pageNumberLeft={pageNumberLeft}
          pageNumberRight={pageNumberRight}
          canFlipPrev={canFlipPrev}
          canFlipNext={canFlipNext}
          onFlipPrev={onFlipPrev}
          onFlipNext={onFlipNext}
          nextButtonLabel={nextButtonLabel}
          isFlipping={isFlipping}
          flipDirection={flipDirection}
        />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-stone-300/80 bg-stone-100/80 py-3 text-center text-xs text-stone-600">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <span className="font-serif">Open Mind — 3D Reasoning Field Journal</span>
          <span className="text-stone-600 font-medium">Gemini 2.5 Flash Multimodal Audio & SpeechSynthesis</span>
        </div>
      </footer>
    </div>
  );
}
