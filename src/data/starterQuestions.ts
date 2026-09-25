import { Question } from '../types';

export const STARTER_QUESTIONS: Question[] = [
  // ── Algebra ──────────────────────────────────────────────────────────────
  {
    id: "q1",
    topic: "Algebra",
    lesson: "Solving Linear Equations",
    text: "Solve for x: 2x + 6 = 14",
    correctAnswer: "4"
  },
  {
    id: "q2",
    topic: "Algebra",
    lesson: "Solving Linear Equations",
    text: "Solve for x: 3x - 5 = 10",
    correctAnswer: "5"
  },
  {
    id: "q6",
    topic: "Algebra",
    lesson: "Solving Linear Equations",
    text: "Solve for x: 5x + 2 = 2x + 11",
    correctAnswer: "3"
  },
  {
    id: "q7",
    topic: "Algebra",
    lesson: "Solving Linear Equations",
    text: "Solve for x: 4x - 8 = 0",
    correctAnswer: "2"
  },
  {
    id: "q8",
    topic: "Algebra",
    lesson: "Solving Linear Equations",
    text: "Solve for x: 7 - 2x = 1",
    correctAnswer: "3"
  },
  {
    id: "q9",
    topic: "Algebra",
    lesson: "Solving Linear Equations",
    text: "Solve for x: 6x + 3 = 3x + 12",
    correctAnswer: "3"
  },
  {
    id: "q10",
    topic: "Algebra",
    lesson: "Solving Inequalities",
    text: "Solve for x: 2x - 4 > 0. What is the smallest integer value of x that satisfies this inequality?",
    correctAnswer: "3"
  },

  // ── C++ Loops ────────────────────────────────────────────────────────────
  {
    id: "q3",
    topic: "C++ Basics",
    lesson: "Loops",
    text: "What is the output of this loop?\nfor (int i = 0; i < 3; i++) { cout << i; }",
    correctAnswer: "012"
  },
  {
    id: "q4",
    topic: "C++ Basics",
    lesson: "Loops",
    text: "What is the output of this loop?\nfor (int i = 1; i <= 3; i++) { cout << i * 2; }",
    correctAnswer: "246"
  },
  {
    id: "q11",
    topic: "C++ Basics",
    lesson: "Loops",
    text: "What is the output of this loop?\nfor (int i = 5; i > 2; i--) { cout << i; }",
    correctAnswer: "543"
  },
  {
    id: "q12",
    topic: "C++ Basics",
    lesson: "Loops",
    text: "How many times does the body of this loop execute?\nfor (int i = 0; i < 10; i += 2) { cout << i; }",
    correctAnswer: "5"
  },
  {
    id: "q13",
    topic: "C++ Basics",
    lesson: "Loops",
    text: "What is the output of this loop?\nint s = 0;\nfor (int i = 1; i <= 4; i++) { s += i; }\ncout << s;",
    correctAnswer: "10"
  },
  {
    id: "q14",
    topic: "C++ Basics",
    lesson: "While Loops",
    text: "What is the output?\nint x = 1;\nwhile (x < 5) { cout << x; x *= 2; }",
    correctAnswer: "124"
  },

  // ── Arithmetic ───────────────────────────────────────────────────────────
  {
    id: "q5",
    topic: "Arithmetic",
    lesson: "Order of Operations",
    text: "What is 4 + 2 * 3?",
    correctAnswer: "10"
  },
  {
    id: "q15",
    topic: "Arithmetic",
    lesson: "Order of Operations",
    text: "What is (4 + 2) * 3?",
    correctAnswer: "18"
  },
  {
    id: "q16",
    topic: "Arithmetic",
    lesson: "Order of Operations",
    text: "What is 10 - 3 * 2 + 1?",
    correctAnswer: "5"
  },
  {
    id: "q17",
    topic: "Arithmetic",
    lesson: "Fractions",
    text: "What is 3/4 + 1/4?",
    correctAnswer: "1"
  },
  {
    id: "q18",
    topic: "Arithmetic",
    lesson: "Percentages",
    text: "What is 20% of 80?",
    correctAnswer: "16"
  },

  // ── Calculus ─────────────────────────────────────────────────────────────
  {
    id: "q19",
    topic: "Calculus",
    lesson: "Derivatives",
    text: "What is the derivative of f(x) = x²?",
    correctAnswer: "2x"
  },
  {
    id: "q20",
    topic: "Calculus",
    lesson: "Derivatives",
    text: "What is the derivative of f(x) = 3x³?",
    correctAnswer: "9x²"
  },
  {
    id: "q21",
    topic: "Calculus",
    lesson: "Limits",
    text: "What is the limit as x → 2 of f(x) = x² - 4?",
    correctAnswer: "0"
  },
  {
    id: "q22",
    topic: "Calculus",
    lesson: "Integration",
    text: "What is the indefinite integral of f(x) = 2x? (Ignore the constant of integration.)",
    correctAnswer: "x²"
  },

  // ── Number Theory ────────────────────────────────────────────────────────
  {
    id: "q23",
    topic: "Number Theory",
    lesson: "Factors & Multiples",
    text: "What is the greatest common divisor (GCD) of 12 and 18?",
    correctAnswer: "6"
  },
  {
    id: "q24",
    topic: "Number Theory",
    lesson: "Prime Numbers",
    text: "Is 37 a prime number? Answer yes or no.",
    correctAnswer: "yes"
  },
  {
    id: "q25",
    topic: "Number Theory",
    lesson: "Exponents",
    text: "What is 2⁵?",
    correctAnswer: "32"
  },
];
