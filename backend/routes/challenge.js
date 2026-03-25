import express from "express";
import { db } from "../firebase.js";
import verifyCookie from "../middlewares/verifyCookie.js";
import { getWeekId, generateWeeklyChallenge } from "../jobs/challengeScheduler.js";

const router = express.Router();

// ─── GET /challenge/weekly ────────────────────────────────────────────────────
// Returns this week's quiz (no correct answers) + whether user already attempted
router.get("/weekly", verifyCookie, async (req, res) => {
  try {
    const weekId = getWeekId();
    const userId = req.user.uid; // from verifyCookie → Firebase decoded claims

    // If no challenge exists yet for this week, generate one on the fly
    const challengeRef = db.collection("weeklyChallenges").doc(weekId);
    let challengeSnap = await challengeRef.get();

    if (!challengeSnap.exists) {
      console.log("No challenge for this week yet, generating...");
      await generateWeeklyChallenge();
      challengeSnap = await challengeRef.get();
    }

    if (!challengeSnap.exists) {
      return res
        .status(404)
        .json({ error: "Challenge could not be generated" });
    }

    const challenge = challengeSnap.data();

    // Check if this user already submitted this week
    const attemptSnap = await db
      .collection("challengeAttempts")
      .doc(`${userId}_${weekId}`)
      .get();

    const alreadyAttempted = attemptSnap.exists;
    const previousScore = alreadyAttempted
      ? attemptSnap.data().score
      : null;

    // Strip correctAnswer before sending to frontend
    const safeQuestions = challenge.questions.map(
      ({ question, options }, index) => ({ index, question, options })
    );

    return res.json({
      success: true,
      weekId,
      title: challenge.title,
      tags: challenge.tags,
      questions: safeQuestions,
      alreadyAttempted,
      previousScore,
    });
  } catch (err) {
    console.error("❌ GET /challenge/weekly error:", err.message);
    return res.status(500).json({ error: "Server error" });
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
      .collection("weeklyChallenges")
      .doc(weekId)
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

    const score = correctCount * 100; // 100 pts per correct, max 1000

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
router.get("/leaderboard", verifyCookie, async (req, res) => {
  try {
    const weekId = getWeekId();

    const attemptsSnap = await db
      .collection("challengeAttempts")
      .where("weekId", "==", weekId)
      .orderBy("score", "desc")
      .limit(20)
      .get();

    const leaderboard = [];

    for (const doc of attemptsSnap.docs) {
      const attempt = doc.data();
      // Fetch user's name from Firestore
      const userSnap = await db
        .collection("users")
        .doc(attempt.userId)
        .get();
      const userName = userSnap.exists ? userSnap.data().name : "Unknown";

      leaderboard.push({
        name: userName,
        score: attempt.score,
        correctCount: attempt.correctCount,
        submittedAt: attempt.submittedAt,
      });
    }

    return res.json({ success: true, weekId, leaderboard });
  } catch (err) {
    console.error("❌ GET /challenge/leaderboard error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});
router.get("/generate-now", async (req, res) => {
  await generateWeeklyChallenge();
  res.json({ success: true, message: "Challenge generated!" });
});


export default router;