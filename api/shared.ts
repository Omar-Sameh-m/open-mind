/**
 * Shared helpers for Vercel serverless functions in /api.
 * Extracted to avoid verbatim duplication between analyze.ts and transcribe.ts.
 */
import { GoogleGenAI } from '@google/genai';

/** Model names tried in order until one succeeds (highest quota first). */
export const MODEL_CASCADE = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
];

/** Returns an authenticated GoogleGenAI client, or null if the API key is missing. */
export function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/** Tries each model in MODEL_CASCADE and returns on first success. */
export async function callGenAIWithCascade(ai: GoogleGenAI, params: any) {
  let lastError: any = null;
  for (const model of MODEL_CASCADE) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
      });
      return { response, model };
    } catch (err: any) {
      console.warn(`Model ${model} failed (${err?.status || err?.code}): ${err?.message?.slice(0, 100)}`);
      lastError = err;
    }
  }
  throw lastError || new Error('All candidate Gemini models in cascade failed');
}

/**
 * Reads the request body whether it is already parsed by the runtime (Express/Vercel)
 * or needs to be streamed from the raw Node.js IncomingMessage.
 */
export async function parseBody(req: any): Promise<any> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return req.body;
      }
    }
    return req.body;
  }

  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(data);
      }
    });
    req.on('error', reject);
  });
}

/** Sends a JSON response compatible with both Express-style and raw Node.js responses. */
export function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}
