import { Question, AnalyzeResult } from '../types';

export async function transcribeAudioWithGemini(
  audioBlob: Blob
): Promise<string> {
  let audioBase64: string | undefined = undefined;
  let mimeType: string = audioBlob.type || 'audio/webm';

  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    audioBase64 = btoa(binary);
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
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Audio transcription failed with status ${response.status}`);
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
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      audioBase64 = btoa(binary);
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
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Analysis request failed with status ${response.status}`);
  }

  const data: AnalyzeResult = await response.json();
  if (!data || !data.classification) {
    throw new Error('Invalid analysis result structure received from Gemini');
  }
  return data;
}
