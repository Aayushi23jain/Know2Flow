import cron from "node-cron";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../firebase.js";

//const genAI = new GoogleGenerativeAI(process.env.CHALLENGE_GEMINI_API_KEY);

let isGenerating = false;
const genAI = new GoogleGenerativeAI(process.env.CHALLENGE_GEMINI_API_KEY);
console.log("🔑 Using Gemini key:", process.env.CHALLENGE_GEMINI_API_KEY?.slice(0, 8) + "...");
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
export async function generateWeeklyChallenge() {
  if (isGenerating) return;
  isGenerating = true;
  try {
    const weekId = getWeekId();
    await db.collection("weeklyChallenges").doc(weekId).set({
      weekId,
      title: "Weekly Challenge: JavaScript & DSA",
      tags: ["javascript", "dsa"],
      questions: [
        { question: "What does 'typeof null' return in JavaScript?", options: ["null", "object", "undefined", "string"], correctAnswer: 1 },
        { question: "Which data structure uses LIFO?", options: ["Queue", "Stack", "Tree", "Graph"], correctAnswer: 1 },
        { question: "What is the time complexity of binary search?", options: ["O(n)", "O(n²)", "O(log n)", "O(1)"], correctAnswer: 2 },
        { question: "Which keyword declares a block-scoped variable?", options: ["var", "let", "both", "none"], correctAnswer: 1 },
        { question: "What does '===' check in JavaScript?", options: ["Value only", "Type only", "Value and type", "Reference"], correctAnswer: 2 },
        { question: "Which sorting algorithm has O(n log n) average case?", options: ["Bubble sort", "Merge sort", "Selection sort", "Insertion sort"], correctAnswer: 1 },
        { question: "What is a closure in JavaScript?", options: ["A loop", "A function with access to outer scope", "A class", "An object"], correctAnswer: 1 },
        { question: "Which array method does not mutate the original?", options: ["push", "pop", "map", "splice"], correctAnswer: 2 },
        { question: "What is the output of '0.1 + 0.2 === 0.3' in JS?", options: ["true", "false", "undefined", "error"], correctAnswer: 1 },
        { question: "Which traversal visits root first?", options: ["Inorder", "Postorder", "Preorder", "BFS"], correctAnswer: 2 },
      ],
      generatedAt: new Date(),
    });
    console.log(`✅ Weekly challenge saved for ${weekId}`);
  } catch (err) {
    console.error("❌ Failed:", err.message);
  } finally {
    isGenerating = false;
  }
}

// ─── Cron: Every Sunday at 00:00 ─────────────────────────────────────────────
export function startChallengeScheduler() {
  cron.schedule("0 0 * * 0", () => {
    console.log("⏰ Sunday cron triggered — generating new challenge");
    generateWeeklyChallenge();
  });

  console.log("📅 Challenge scheduler started (fires every Sunday 00:00)");
}