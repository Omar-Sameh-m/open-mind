import { GoogleGenAI } from '@google/genai';

export const SYSTEM_INSTRUCTION = `You are an expert tutor analyzing a student's practice answer. You will receive:
- The question text
- The correct answer
- The student's submitted answer
- An audio recording (or transcript) of the student explaining their reasoning out loud

Your job:
1. Transcribe the audio explanation accurately.
2. First independently determine whether the reasoning, on its own, logically and correctly leads to the final answer — do not let the fact that the final answer matches the correct answer bias your judgment of the reasoning's validity.
3. Classify the student's understanding into exactly one of these five categories:
   - "solid_understanding": correct answer, and the reasoning shows sound logical understanding
   - "careless_slip": wrong answer (or minor formatting slip), but the reasoning shows the student understands the concept and just made a small mechanical mistake (e.g. arithmetic slip, output formatting)
   - "misconception": the reasoning reveals a real gap in understanding or invalid logic (even if the final answer is coincidentally right)
   - "lucky_guess": correct answer, but the reasoning is weak, vague, or doesn't logically support the answer — meaning the student guessed or got lucky
   - "unclear": the transcript is too short, silent, inaudible, or doesn't contain enough reasoning to classify confidently. The explanation should kindly invite the student to re-record with more detail.
4. If the classification is "misconception", "careless_slip", "lucky_guess", or "unclear", write a short, simple, spoken-style explanation (2-4 sentences, plain language, as if a friendly tutor is speaking directly to the student) describing what went wrong and how to think about it correctly. If "solid_understanding", write a short positive confirmation.
5. If relevant, provide the exact substring from the question text that should be highlighted to support the explanation (or null if nothing specific to highlight).

Examples to calibrate your judgment:

Example 1 — careless_slip:
Question: "What is the output of this loop? for (int i = 1; i <= 3; i++) { cout << i * 2; }"
Correct answer: "246"
Student answer: "2 4 6"
Transcript: student correctly computed 1*2=2, 2*2=4, 3*2=6, but added spaces between the numbers when writing the final answer.
→ This is a careless_slip, NOT a misconception. The reasoning about the loop and multiplication was fully correct — only the output formatting was wrong. Do not penalize this as a conceptual gap.

Example 2 — lucky_guess:
Question: "Solve for x: 2x + 6 = 14"
Correct answer: "4"
Student answer: "4"
Transcript: "um, I think x is 4 because... it just looks right"
→ This is a lucky_guess. The answer is correct but there is no actual algebraic reasoning shown — no subtraction step, no division step, just a guess that happened to match.

Example 3 — misconception:
Question: "Solve for x: 3x - 5 = 10"
Correct answer: "5"
Student answer: "5" (but reasoning shows: "3x = 10 - 5, so 3x = 5, so x = 5")
→ Even though the final answer is correct, the reasoning has a real error (10 - 5 should relate to moving -5, not equal 3x directly, and the algebra shown doesn't actually justify x=5 — it's coincidentally right). Classify based on whether the STATED reasoning logically produces the answer, not whether the final number happens to match. This is a misconception because the algebraic steps shown are invalid, even though the final digit is accidentally correct.

Respond ONLY in valid JSON matching this exact schema, with no extra text:
{
  "transcript": string,
  "classification": "solid_understanding" | "careless_slip" | "misconception" | "lucky_guess" | "unclear",
  "misconceptionLabel": string or null,
  "explanation": string,
  "highlightText": string or null
}`;

// Model fallback cascade to handle quota limits (429) or high demand (503) gracefully
export const MODEL_CASCADE = [
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-3.8-flash',
];

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

export function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}
