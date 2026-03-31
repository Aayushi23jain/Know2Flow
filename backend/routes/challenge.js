import express from "express";
import { db } from "../firebase.js";

import verifyCookie from "../middlewares/verifyCookie.js";
import {
  getWeekId
} from "../jobs/challengeScheduler.js";
import { getUserProfile } from "../utils/getUserProfile.js";
import OpenAI from "openai";
import { sanitizeQuestions } from "../jobs/challengeScheduler.js";


// const questions = sanitizeQuestions(JSON.parse(text));

const openai = new OpenAI({
  apiKey: process.env.CHALLENGE_GEMINI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});



const router = express.Router();



router.get("/weekly", verifyCookie, async (req, res) => {
  try {
    const userId = req.user.uid;
    const weekId = getWeekId();

    const docId = `${userId}_${weekId}`;
    const challengeRef = db.collection("userChallenges").doc(docId);

    // ✅ 1. Check if already exists
     const existingSnap = await challengeRef.get();

if (existingSnap.exists) {
  const challenge = existingSnap.data();

  const alreadyAttempted = challenge.attempted || false;
      const previousScore = challenge.score || null;

  const safeQuestions = challenge.questions.map(
    ({ question, options }, index) => ({
      index,
      question,
      options,
    })
  );

  return res.json({
    success: true,
    questions: safeQuestions,
    title: challenge.title,
    tags: challenge.tags,
    alreadyAttempted,
    previousScore,
  });
}

    // ✅ 2. Generate NEW quiz
    const { teachSkills, experienceLevel } = await getUserProfile(userId);

    const skillsText = teachSkills.length
      ? teachSkills.join(", ")
      : "general knowledge";

    const prompt = `
Generate exactly 10 multiple choice questions STRICTLY based on these skills:

Skills: ${skillsText}
Experience Level: ${experienceLevel}

Rules:
- Questions must ONLY be about these skills
- Do NOT include programming unless skills mention it
- Keep difficulty aligned with experience level
- Each question must have 4 options
- correctAnswer must be 0–3
- Return ONLY JSON array

Each item must be:
{
  "question": "string",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": 0
}
`;

    const response = await openai.chat.completions.create({
      model: "qwen/qwen3-next-80b-a3b-instruct",
      // model: "arcee-ai/trinity-mini",
      messages: [
        { role: "system", content: "You generate strict JSON quiz data." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    let text = response.choices?.[0]?.message?.content || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const questions = sanitizeQuestions(JSON.parse(text));

    // ✅ 3. SAVE in Firestore
    await challengeRef.set({
      userId,
      weekId,
      title: "Personalized Challenge",
      tags: teachSkills,
      questions, // includes correctAnswer
      createdAt: new Date(),
    });

    // ✅ 4. Send SAFE version to frontend
    const safeQuestions = questions.map(({ question, options }, index) => ({
      index,
      question,
      options,
    }));

  



    return res.json({
      success: true,
      questions: safeQuestions,
      title: "Personalized Challenge",
  tags: teachSkills,
      alreadyAttempted:false,
  previousScore:null,
    });

  } catch (err) {
    console.error("❌ Error:", err.message);
    return res.status(500).json({ error: "Failed to load challenge" });
  }
});

// ─── POST /challenge/submit ───────────────────────────────────────────────────
// Body: { answers: [{ questionIndex: 0, selectedOption: 2 }, ...] }
router.post("/submit", verifyCookie, async (req, res) => {
  try {
    const weekId = getWeekId();
    const userId = req.user.uid;

    // Block re-submission at the backend level too
    const attemptRef = db
      .collection("challengeAttempts")
      .doc(`${userId}_${weekId}`);

    const existing = await attemptRef.get();
    if (existing.exists) {
      return res.status(400).json({
        error: "Already submitted this week's challenge",
        score: existing.data().score,
      });
    }

    // Fetch challenge with correct answers for grading
    const challengeSnap = await db
      // .collection("weeklyChallenges")
      .collection("userChallenges")
.doc(`${userId}_${weekId}`)
      // .doc(weekId)
      .get();

    if (!challengeSnap.exists) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    const { questions } = challengeSnap.data();
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Invalid answers format" });
    }

    // Grade
    let correctCount = 0;
    const gradedAnswers = questions.map((q, index) => {
      const userAnswer = answers.find((a) => a.questionIndex === index);
      const selectedOption = userAnswer?.selectedOption ?? -1;
      const isCorrect = selectedOption === q.correctAnswer;
      if (isCorrect) correctCount++;
      return { questionIndex: index, selectedOption, isCorrect };
    });

    const score = correctCount * 10; // 10 pts per correct, max 1000

    // Save attempt to Firestore
    await attemptRef.set({
      userId,
      weekId,
      answers: gradedAnswers,
      score,
      correctCount,
      total: questions.length,
      submittedAt: new Date(),
    });

    const challengeRef = db
  .collection("userChallenges")
  .doc(`${userId}_${weekId}`);

await challengeRef.update({
  attempted: true,
  score,
});

// ✅ Update user's total score safely
const userRef = db.collection("users").doc(userId);

await db.runTransaction(async (transaction) => {
  const userSnap = await transaction.get(userRef);

  let prevScore = 0;

  if (userSnap.exists) {
    prevScore = userSnap.data().totalScore || 0;
  }

  const newTotalScore = prevScore + score;

  transaction.update(userRef, {
    totalScore: newTotalScore,
  });
});

    return res.json({
      success: true,
      score,
      correctCount,
      total: questions.length,
      gradedAnswers,
    });
  } catch (err) {
    console.error("❌ POST /challenge/submit error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /challenge/leaderboard ───────────────────────────────────────────────
router.get("/global-leaderboard", async (req, res) => {
  try {
    const usersSnap = await db.collection("users").get();

    const leaderboard = usersSnap.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name || "Unknown",
        points: data.totalScore || 0, // ✅ default 0
      };
    });

    // ✅ Sort descending
    leaderboard.sort((a, b) => b.points - a.points);

    return res.json({
      success: true,
      leaderboard,
    });

  } catch (err) {
    console.error("❌ Leaderboard error:", err.message);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});


export default router;
