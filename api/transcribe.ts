import { GoogleGenAI } from '@google/genai';

const MODEL_CASCADE = [
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-3.8-flash',
];

function getGenAI(): GoogleGenAI | null {
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

async function callGenAIWithCascade(ai: GoogleGenAI, params: any) {
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

async function parseBody(req: any): Promise<any> {
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

function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const body = await parseBody(req);
    const { audioBase64, mimeType } = body || {};

    if (!audioBase64) {
      return sendJson(res, 200, { transcript: '' });
    }

    const ai = getGenAI();
    if (!ai) {
      return sendJson(res, 500, {
        error: 'GEMINI_API_KEY is not configured in Vercel environment variables.'
      });
    }

    const { response } = await callGenAIWithCascade(ai, {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Transcribe the following spoken student explanation accurately into plain text. Only return the transcribed text, nothing else. If inaudible or empty, return "[Inaudible audio]".'
            },
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: audioBase64
              }
            }
          ]
        }
      ]
    });

    const transcript = response.text?.trim() || '';
    return sendJson(res, 200, { transcript });
  } catch (err: any) {
    console.error('Transcribe error in /api/transcribe:', err?.message);
    return sendJson(res, 500, { error: err?.message || 'Audio transcription failed' });
  }
}
