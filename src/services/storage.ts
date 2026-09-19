import { AppData, Session } from '../types';

const STORAGE_KEY = 'openmind_data';

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
