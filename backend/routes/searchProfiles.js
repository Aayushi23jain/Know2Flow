import express from "express";
import { db } from "../firebase.js";
import { index } from "../pinecone.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId } = req.body;

    // 1️⃣ Get current user profile
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userDoc.data();

    // 2️⃣ Primary filtration: by same language + exclude self
    const snapshot = await db
      .collection("users")
      .where("language", "==", user.language)
      .get();

    const candidates = [];
    snapshot.forEach((doc) => {
      if (doc.id !== userId) {
        candidates.push({ id: doc.id, ...doc.data() });
      }
    });

    if (candidates.length === 0) {
      return res.status(200).json({ matches: [] });
    }

    // 3️⃣ Fetch embeddings for current user
    const fetchResponse = await index.fetch([
      `${userId}-teach`,
      `${userId}-learn`,
    ]);
    const vectors = fetchResponse.records || fetchResponse.vectors || {};

    const userTeachEmbedding = vectors[`${userId}-teach`]?.values;
    const userLearnEmbedding = vectors[`${userId}-learn`]?.values;

    if (!userTeachEmbedding || !userLearnEmbedding) {
      return res.status(400).json({ error: "Missing teach/learn embeddings for this user" });
    }

    // 4️⃣ Fetch embeddings for candidates
    const ids = [];
    candidates.forEach((c) => {
      ids.push(`${c.id}-teach`);
      ids.push(`${c.id}-learn`);
    });
    const candidateResponse = await index.fetch(ids);
    const candidateVectors = candidateResponse.records || candidateResponse.vectors || {};

    // 5️⃣ Cosine similarity function
    function cosineSimilarity(a, b) {
      let dot = 0.0, normA = 0.0, normB = 0.0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // 6️⃣ Compare embeddings
    const scored = candidates.map((c) => {
      const teachVec = candidateVectors[`${c.id}-teach`]?.values;
      const learnVec = candidateVectors[`${c.id}-learn`]?.values;
      if (!teachVec || !learnVec) return null;

      const learnScore = cosineSimilarity(userLearnEmbedding, teachVec); // user wants to learn ↔ candidate teaches
      const teachScore = cosineSimilarity(userTeachEmbedding, learnVec); // user teaches ↔ candidate wants to learn

      return {
        userId: c.id,
        name: c.name || "Unnamed",
        learnScore,
        teachScore,
        finalScore: (learnScore + teachScore) / 2,
      };
    }).filter(Boolean);

    // 7️⃣ Sort results and pick top 3
    const sorted = scored
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 3);

    return res.status(200).json({ matches: sorted });


  } catch (error) {
    console.error("❌ Error in search-profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

