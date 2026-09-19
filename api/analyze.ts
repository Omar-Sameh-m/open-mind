import { Type } from '@google/genai';
import {
  getGenAI,
  callGenAIWithCascade,
  SYSTEM_INSTRUCTION,
  parseBody,
  sendJson
} from './_lib/gemini';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const body = await parseBody(req);
    const { question, studentAnswer, audioBase64, mimeType, fallbackTranscript } = body || {};

    if (!question || !question.text || studentAnswer === undefined) {
      return sendJson(res, 400, { error: 'Missing question or studentAnswer' });
    }

    const ai = getGenAI();
    if (!ai) {
      return sendJson(res, 500, { error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const parts: any[] = [
      {
        text: `Question: ${question.text}\nLesson: ${question.lesson || ''}\nTopic: ${question.topic || ''}\nCorrect answer: ${question.correctAnswer}\nStudent's submitted answer: ${studentAnswer}`
      }
    ];

    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'audio/webm',
          data: audioBase64
        }
      });
      if (fallbackTranscript && fallbackTranscript.trim()) {
        parts.push({
          text: `Student edited transcript note: "${fallbackTranscript.trim()}"`
        });
      }
    } else if (fallbackTranscript && fallbackTranscript.trim()) {
      parts.push({
        text: `Student's spoken reasoning transcript: ${fallbackTranscript.trim()}`
      });
    } else {
      parts.push({
        text: 'The student submitted no audio and no spoken reasoning transcript.'
      });
    }

    const { response } = await callGenAIWithCascade(ai, {
      contents: [
        {
          role: 'user',
          parts
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            classification: {
              type: Type.STRING,
              enum: ['solid_understanding', 'careless_slip', 'misconception', 'lucky_guess', 'unclear']
            },
            misconceptionLabel: { type: Type.STRING, nullable: true },
            explanation: { type: Type.STRING },
            highlightText: { type: Type.STRING, nullable: true }
          },
          required: ['transcript', 'classification', 'explanation']
        }
      }
    });

    const text = response.text?.trim() || '';
    if (!text) {
      throw new Error('Empty response received from Gemini API');
    }

    const parsed = JSON.parse(text);

    const validClassifications = [
      'solid_understanding',
      'careless_slip',
      'misconception',
      'lucky_guess',
      'unclear'
    ];

    if (!validClassifications.includes(parsed.classification)) {
      throw new Error(`Invalid classification category "${parsed.classification}" returned by Gemini`);
    }

    return sendJson(res, 200, {
      transcript: parsed.transcript || (fallbackTranscript ? fallbackTranscript.trim() : ''),
      classification: parsed.classification,
      misconceptionLabel: parsed.misconceptionLabel ?? null,
      explanation: parsed.explanation,
      highlightText: parsed.highlightText ?? null
    });
  } catch (err: any) {
    console.error('Analysis error in /api/analyze:', err?.message);
    return sendJson(res, 500, {
      error: err?.message || 'Failed to analyze reasoning with Gemini. Please try again.'
    });
  }
}
