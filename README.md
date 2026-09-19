<div align="center">

# 🧠 Open Mind

### **Multimodal AI Reasoning Analysis for Students**

*Evaluating the student's thought process, not just their final answer.*

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-Multimodal-4285F4?logo=google&logoColor=white)](https://aistudio.google.com/)

</div>

---

## 📖 Overview

Standard educational quizzes have a fundamental flaw: they only grade whether a final number or option is correct. 

- A student who guesses blindly can get lucky and receive full marks without understanding.
- A student who makes a tiny arithmetic slip gets marked wrong even if their logic was flawless.
- A student can use completely invalid math that happens to stumble onto the right digit by coincidence.

**Open Mind** solves this by listening to students explain their reasoning out loud as they solve problems. Powered by Google Gemini multimodal models, it independently analyzes both the spoken reasoning and the final answer to detect true conceptual mastery.

---

## 📸 Screenshots

<div align="center">

### 1. Interactive Question & Voice Explanation
*Students solve problems and record their reasoning out loud using voice or speech-to-text.*

<img src="images/screenshots/questions.png" alt="Question Practice Screen" width="850" />

<br/><br/>

### 2. Deep Reasoning Analysis & Diagnostics
*Gemini classifies the attempt into categories like Solid Understanding, Careless Slip, Misconception, or Lucky Guess, providing tailored feedback and highlighting specific problem areas.*

<img src="images/screenshots/review.png" alt="Analysis and Review Screen" width="850" />

<br/><br/>

### 3. Study Notes & Progress Tracking
*Review past attempts, track recurring misconceptions, and review key learning takeaways.*

<img src="images/screenshots/notes_section.png" alt="Notes and Progress Screen" width="850" />

</div>

---

## 🎯 Reasoning Classification Engine

When a student submits an attempt with voice reasoning, Open Mind categorizes their understanding into one of five distinct states:

| Classification | Meaning | Tutor Action |
|---|---|---|
| 🌟 **Solid Understanding** | Correct answer backed by sound, valid logic. | Validates and encourages mastery. |
| ⚡ **Careless Slip** | Conceptually sound reasoning, but a small mechanical/formatting slip. | Acknowledges correct logic while pointing out the mechanical error. |
| 🔍 **Misconception** | Flawed reasoning or conceptual gap (even if the final answer was accidentally right). | Pinpoints where the reasoning derailed and explains the concept clearly. |
| 🎲 **Lucky Guess** | Correct answer, but vague, missing, or unsupported reasoning. | Prompts the student to justify their answer with logical steps. |
| ❓ **Unclear** | Audio was silent, inaudible, or too brief to assess. | Kindly invites the student to re-record with more detail. |

---

## ✨ Features

- 🎙️ **Multimodal Voice Ingestion**: Directly accepts WebM audio blobs from the student's microphone.
- ⚡ **Model Fallback Cascade**: Employs resilient Gemini model fallback (`gemini-2.5-flash-lite`, `gemini-3.5-flash`, etc.) to guarantee high availability and handle rate limits gracefully.
- 🎯 **Context Highlighting**: Identifies and highlights the exact excerpt from the question text related to the student's error.
- 🔒 **Zero Client-Side Leaks**: The Gemini API key is guarded entirely inside serverless API routes (`/api/*`), never exposed to the client bundle.
- 🚀 **Serverless Architecture**: Designed natively for Vercel deployment with zero persistent server overhead.
- 🎨 **Modern Interface**: Built with React 19, Tailwind CSS v4, Lucide icons, and Motion animations.

---

## 🏗️ Architecture

```text
open-mind/
├── api/                     # Vercel Serverless Functions
│   ├── _lib/
│   │   └── gemini.ts        # Shared Gemini client, prompts & fallback cascade
│   ├── analyze.ts           # POST /api/analyze (multimodal reasoning analysis)
│   ├── transcribe.ts        # POST /api/transcribe (speech transcription)
│   └── health.ts            # GET /api/health (service & API key check)
├── images/
│   └── screenshots/         # UI previews
├── src/                     # React 19 SPA Frontend
│   ├── components/          # Reusable UI components
│   ├── data/                # Practice questions & curriculum data
│   ├── services/            # API client services
│   ├── App.tsx              # Main application container
│   └── main.tsx             # React entry point
├── vercel.json              # Vercel routing & rewrite configuration
├── vite.config.ts           # Vite build & local development server plugin
└── package.json
```

---

## 💻 Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- A [Gemini API Key](https://aistudio.google.com/app/apikey) from Google AI Studio

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Omar-Sameh-m/open-mind.git
cd open-mind
npm install
```

### 2. Configure Environment Variables
Create a `.env` or `.env.local` file from the example:
```bash
cp .env.example .env
```

Add your Gemini API key:
```env
GEMINI_API_KEY="AIzaSyYourActualKeyHere"
```

### 3. Run the Development Server
```bash
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

> [!TIP]
> During local development, Vite automatically routes calls to `/api/health`, `/api/analyze`, and `/api/transcribe` into the serverless handlers. You can verify your setup by opening `http://localhost:5173/api/health`.

---

## 🚀 Deploying to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Push your project to **GitHub**.
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your `open-mind` repository.
4. Vercel will automatically detect:
   - **Framework Preset**: `Vite`
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
5. In **Environment Variables**, add:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `your_gemini_api_key`
6. Click **Deploy**.

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Link and deploy
vercel

# Set the environment variable in Vercel
vercel env add GEMINI_API_KEY

# Deploy to production
vercel --prod
```

---

## 🔑 Environment Variables

| Variable | Required | Description | Where to Obtain |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key used for voice transcription and multimodal reasoning evaluation. | [Google AI Studio](https://aistudio.google.com/app/apikey) |

---

## 🛠️ Scripts

- `npm run dev` — Starts the local Vite development server with built-in API handler support.
- `npm run build` — Compiles the TypeScript code and produces production assets in `dist/`.
- `npm run preview` — Locally previews the production build.
- `npm run lint` — Runs TypeScript type-checking without emitting files (`tsc --noEmit`).

---

## 📄 License

MIT © [Omar Sameh](https://github.com/Omar-Sameh-m)
