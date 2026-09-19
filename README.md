
## What is Open Mind?

Standard educational tools grade students solely on their final output: right or wrong. This creates three critical blind spots in learning:

- **Lucky guesses** get marked correct even when the student has no grasp of the concept.
- **Careless slips** (like a small arithmetic error in the final step) get marked completely wrong, ignoring otherwise sound logic.
- **Flawed logic** that happens to land on the correct answer by coincidence goes completely unnoticed.

**Open Mind** changes this dynamic. Instead of just typing an answer, students talk through their reasoning out loud. Powered by Google Gemini's multimodal audio capabilities, the system evaluates the student's spoken thought process independently of their final answer to diagnose what they actually understand.

---

## How It Works

1. **Practice**: The student is presented with a problem (e.g. algebra, code tracing, or science concepts).
2. **Explain Out Loud**: The student speaks their thought process while solving the problem. The audio is captured directly via their microphone.
3. **Multimodal Analysis**: The audio and answer are sent to serverless Gemini endpoints. Gemini transcribes the speech and evaluates the logic against the problem requirements.
4. **Diagnostic Feedback**: Rather than a binary score, the student receives one of five diagnostic classifications, accompanied by spoken-style tutor feedback and text highlighting.

---

## Diagnostic Classifications

| Classification | What it means | How the system responds |
|---|---|---|
| **Solid Understanding** | Correct answer with logically sound reasoning. | Validates mastery and confirms the method. |
| **Careless Slip** | Conceptually sound reasoning undermined by a mechanical error. | Acknowledges correct understanding while pointing out the arithmetic or formatting slip. |
| **Misconception** | Invalid logical steps or conceptual misunderstanding. | Identifies where the reasoning derailed and explains the core concept. |
| **Lucky Guess** | Correct answer, but reasoning is absent, vague, or illogical. | Prompts the student to explain the steps behind their answer. |
| **Unclear** | Audio was silent, inaudible, or too brief to judge. | Kindly invites the student to re-record with more detail. |

---

## Screenshots

### 1. Problem View & Spoken Reasoning
Students solve the problem and record their thought process using the built-in voice recorder.

![Problem Practice Screen](images/screenshots/questions.png)

### 2. Diagnostic Analysis & Feedback
Gemini breaks down the reasoning, highlights the relevant part of the question text, and provides targeted tutor feedback.

![Analysis and Review Screen](images/screenshots/review.png)

### 3. Study Notes & Progress
Past attempts and diagnosed misconceptions are saved locally so students can review their learning patterns.

![Notes and Progress Screen](images/screenshots/notes_section.png)

---

## Core Features

- **Direct Multimodal Audio Analysis**: Audio recordings (`audio/webm`) are passed directly to Gemini, allowing the model to hear pacing, pauses, and reasoning without relying on separate client-side speech-to-text tools.
- **Independent Reasoning Evaluation**: The system explicitly prompts Gemini to assess whether the student's stated reasoning logically produces the answer before comparing it to the correct solution.
- **Model Fallback Cascade**: Implements an automatic fallback chain across Gemini models (`gemini-2.5-flash-lite`, `gemini-3.5-flash`, etc.) so live demonstrations and evaluations aren't interrupted by quota limits or temporary 503 errors.
- **Secure Serverless Architecture**: The Gemini API key is guarded entirely inside serverless API routes (`/api/*`), preventing client-side leaks.
- **Local Persistence**: Tracks study sessions and misconception history in browser storage for quick review.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide Icons
- **Backend**: Vercel Serverless Functions (`api/analyze.ts`, `api/transcribe.ts`, `api/health.ts`)
- **AI**: Google Gemini API via `@google/genai` SDK
- **Hosting**: Vercel (Static SPA + Serverless functions)

---

## Running Locally

If you're judging or testing the project locally:

### 1. Clone & Install
```bash
git clone https://github.com/Omar-Sameh-m/open-mind.git
cd open-mind
npm install
```

### 2. Set Up Environment
Create a `.env` file in the project root:
```bash
cp .env.example .env
```
Add your [Gemini API Key](https://aistudio.google.com/app/apikey):
```env
GEMINI_API_KEY="your_api_key_here"
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

You can verify the backend and API key status anytime at:
```bash
curl http://localhost:5173/api/health
# {"status":"ok","hasApiKey":true}
```

---

## License

MIT © [Omar Sameh](https://github.com/Omar-Sameh-m)
