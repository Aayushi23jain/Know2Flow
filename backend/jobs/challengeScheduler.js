import cron from "node-cron";
import OpenAI from "openai";
import { db } from "../firebase.js";

let isGenerating = false;

const openai = new OpenAI({
  apiKey: process.env.CHALLENGE_GEMINI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export function sanitizeQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) {
    throw new Error("Model did not return an array of questions");
  }

  return rawQuestions.map((q, index) => {
    if (
      !q ||
      typeof q.question !== "string" ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      typeof q.correctAnswer !== "number"
    ) {
      throw new Error(`Invalid question format at index ${index}`);
    }

    return {
      question: q.question.trim(),
      options: q.options.map((opt) => String(opt).trim()),
      correctAnswer: q.correctAnswer,
    };
  });
}

// ─── Get ISO week string e.g. "2026-W12" ─────────────────────────────────────
export function getWeekId(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );

  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}


