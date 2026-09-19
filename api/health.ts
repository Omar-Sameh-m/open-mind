function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default function handler(req: any, res: any) {
  return sendJson(res, 200, {
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
}
