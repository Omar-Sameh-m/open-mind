import { sendJson } from './_lib/gemini';

export default function handler(req: any, res: any) {
  return sendJson(res, 200, {
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
}
