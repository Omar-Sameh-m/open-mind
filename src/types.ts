export interface Question {
  id: string;
  topic: string; // e.g. "Algebra", "C++ Loops"
  lesson: string; // human-readable lesson name, e.g. "Solving Linear Equations"
  text: string; // the question shown to the student
  correctAnswer: string;
}

export type Classification =
  | "solid_understanding"
  | "careless_slip"
  | "misconception"
  | "lucky_guess"
  | "unclear";

export interface Attempt {
  id: string;
  questionId: string;
  studentAnswer: string;
  voiceTranscript: string; // filled in by Gemini from the audio
  classification: Classification;
  misconceptionLabel: string | null; // short label, e.g. "confuses variable with coefficient"
  explanation: string; // spoken-style explanation text (used for TTS)
  highlightText: string | null; // exact substring from question.text to highlight
  timestamp: string;
  audioBlobUrl?: string; // local preview if needed
}

export interface Session {
  id: string;
  timestamp: string;
  attempts: Attempt[];
}

export interface AppData {
  sessions: Session[];
}

export interface AnalyzeResult {
  transcript: string;
  classification: Classification;
  misconceptionLabel: string | null;
  explanation: string;
  highlightText: string | null;
}
