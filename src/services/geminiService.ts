import { Question, AnalyzeResult } from '../types';

/**
 * Efficiently encodes a Blob to a base64 string using the browser's native
 * FileReader API. This avoids the slow per-byte String.fromCharCode loop that
 * causes noticeable UI lag for recordings longer than a few seconds.
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // dataUrl format: "data:<mime>;base64,<actual_base64>"
      const commaIdx = dataUrl.indexOf(',');
      resolve(commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function transcribeAudioWithGemini(
  audioBlob: Blob
): Promise<string> {
  let audioBase64: string | undefined = undefined;
  const mimeType: string = audioBlob.type || 'audio/webm';

  try {
    audioBase64 = await blobToBase64(audioBlob);
  } catch (e) {
    console.warn('Failed to encode audio blob for transcription', e);
    return '';
  }

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      audioBase64,
      mimeType
    })
  });

  if (!response.ok) {
    let errorMsg = `Audio transcription failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.error) errorMsg = errorData.error;
    } catch {
      const text = await response.text().catch(() => '');
      if (text && text.length < 200) errorMsg = text;
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data.transcript || '';
}

export async function analyzeAttemptWithGemini(
  question: Question,
  studentAnswer: string,
  audioBlob: Blob | null,
  fallbackTranscript?: string
): Promise<AnalyzeResult> {
  let audioBase64: string | undefined = undefined;
  let mimeType: string = 'audio/webm';

  if (audioBlob && audioBlob.size > 0) {
    mimeType = audioBlob.type || 'audio/webm';
    try {
      audioBase64 = await blobToBase64(audioBlob);
    } catch (e) {
      console.warn('Failed to encode audio blob to base64', e);
    }
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question,
      studentAnswer,
      audioBase64,
      mimeType,
      fallbackTranscript
    })
  });

  if (!response.ok) {
    let errorMsg = `Analysis request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.error) errorMsg = errorData.error;
    } catch {
      const text = await response.text().catch(() => '');
      if (text && text.length < 200) errorMsg = text;
    }
    throw new Error(errorMsg);
  }

  const data: AnalyzeResult = await response.json();
  if (!data || !data.classification) {
    throw new Error('Invalid analysis result structure received from Gemini');
  }
  return data;
}
