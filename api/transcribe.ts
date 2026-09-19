import {
  getGenAI,
  callGenAIWithCascade,
  parseBody,
  sendJson
} from './_lib/gemini';

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
      return sendJson(res, 500, { error: 'GEMINI_API_KEY is not configured on the server.' });
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
