import { AppData, Question, Attempt, Session } from '../types';

const STORAGE_KEY = 'openmind_data';
/**
 * Separate key for in-progress (not yet saved) session state.
 * Kept distinct from STORAGE_KEY so finalized sessions are never affected.
 */
const IN_PROGRESS_KEY = 'openmind_in_progress';

// ---------------------------------------------------------------------------
// Finalized session helpers (unchanged behaviour)
// ---------------------------------------------------------------------------

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { sessions: [] };
    }
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.sessions)) {
      // Filter out any stale demo sessions from previous versions so the user starts with a clean slate
      const realSessions = parsed.sessions.filter(
        (s: any) => s && s.id && !String(s.id).startsWith('demo-')
      );
      return { sessions: realSessions };
    }
    return { sessions: [] };
  } catch (err) {
    console.error('Failed to parse openmind_data from localStorage', err);
    return { sessions: [] };
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

export function saveSession(newSession: Session): AppData {
  const current = loadAppData();
  const updated: AppData = {
    sessions: [newSession, ...current.sessions]
  };
  saveAppData(updated);
  return updated;
}

export function clearAllSessions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear sessions', err);
  }
}

// ---------------------------------------------------------------------------
// In-progress session helpers (new — Step 4)
// ---------------------------------------------------------------------------

export interface InProgressSession {
  batchQuestions: Question[];
  completedAttempts: Attempt[];
}

/** Persist the current in-progress batch so it survives a page refresh. */
export function saveInProgress(data: InProgressSession): void {
  try {
    localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save in-progress session', err);
  }
}

/**
 * Load an in-progress session from localStorage.
 * Returns null if nothing is saved or the data is stale/corrupt.
 */
export function loadInProgress(): InProgressSession | null {
  try {
    const raw = localStorage.getItem(IN_PROGRESS_KEY);
    if (!raw) return null;
    const parsed: InProgressSession = JSON.parse(raw);
    // Basic shape validation — fail gracefully rather than crash
    if (
      parsed &&
      Array.isArray(parsed.batchQuestions) &&
      parsed.batchQuestions.length > 0 &&
      Array.isArray(parsed.completedAttempts)
    ) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('In-progress session data is corrupt, starting fresh', err);
    clearInProgress();
    return null;
  }
}

/** Remove the in-progress session (call after saving or discarding). */
export function clearInProgress(): void {
  try {
    localStorage.removeItem(IN_PROGRESS_KEY);
  } catch (err) {
    console.error('Failed to clear in-progress session', err);
  }
}

