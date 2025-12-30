import express from "express";
import { db } from "../firebase.js";
import { index, safeFetch, INDEX_AVAILABLE, generateEmbedding } from "../pinecone.js";

const router = express.Router();

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return null;
  let dot = 0.0, normA = 0.0, normB = 0.0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function jaccard(a = [], b = []) {
  const setA = new Set((a || []).map(s => (s || "").toLowerCase()));
  const setB = new Set((b || []).map(s => (s || "").toLowerCase()));
  const inter = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size || 1;
  return inter / union;
}

// Ensure embeddings only when Pinecone is available. Uses safeFetch and handles INDEX_NOT_FOUND gracefully.
async function ensureEmbeddingsForUser(userId, userData) {
  if (!INDEX_AVAILABLE) return { teach: null, learn: null };

  const teachId = `${userId}-teach`;
  const learnId = `${userId}-learn`;

  let records = {};
  try {
    const fetchRes = await safeFetch([teachId, learnId]);
    records = fetchRes.records || fetchRes.vectors || {};
  } catch (err) {
    if (err?.code === "INDEX_NOT_FOUND") {
      console.warn(`Pinecone index not found when fetching embeddings for ${userId}, skipping embedding ops.`);
      return { teach: null, learn: null };
    }
    throw err;
  }

  let teachVec = records[teachId]?.values || null;
  let learnVec = records[learnId]?.values || null;

  try {
    if (!teachVec && Array.isArray(userData.teachSkills) && userData.teachSkills.length) {
      const teachText = userData.teachSkills.join(", ");
      const emb = await generateEmbedding(teachText);
      if (emb?.length) {
        try {
          await index.upsert([{ id: teachId, values: emb, metadata: { userId, type: "teach" } }]);
          teachVec = emb;
        } catch (upsertErr) {
          if (String(upsertErr.message).includes("index") || upsertErr?.code === "INDEX_NOT_FOUND") {
            console.warn("Pinecone index missing at upsert time, skipping upsert.");
          } else {
            console.warn("Pinecone upsert error (ignored):", upsertErr.message || upsertErr);
          }
        }
      }
    }

    if (!learnVec && Array.isArray(userData.learnSkills) && userData.learnSkills.length) {
      const learnText = userData.learnSkills.join(", ");
      const emb = await generateEmbedding(learnText);
      if (emb?.length) {
        try {
          await index.upsert([{ id: learnId, values: emb, metadata: { userId, type: "learn" } }]);
          learnVec = emb;
        } catch (upsertErr) {
          if (String(upsertErr.message).includes("index") || upsertErr?.code === "INDEX_NOT_FOUND") {
            console.warn("Pinecone index missing at upsert time, skipping upsert.");
          } else {
            console.warn("Pinecone upsert error (ignored):", upsertErr.message || upsertErr);
          }
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ Error generating/upserting embeddings for", userId, err.message || err);
  }

  return { teach: teachVec, learn: learnVec };
}

router.post("/", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
    const user = userDoc.data();

    const snapshot = await db.collection("users").where("language", "==", user.language).get();
    const candidates = [];
    snapshot.forEach((doc) => { if (doc.id !== userId) candidates.push({ id: doc.id, ...doc.data() }); });
    if (!candidates.length) return res.status(200).json({ matches: [] });

    console.log("Candidates found:", candidates.map(c => c.id));

    // Decide whether to use Pinecone embeddings
    let useEmbeddings = !!INDEX_AVAILABLE;
    let vectors = {};
    let userTeachEmbedding = null;
    let userLearnEmbedding = null;

    if (useEmbeddings) {
      // Ensure embeddings (generate/upsert if missing)
      await ensureEmbeddingsForUser(userId, user);
      for (const c of candidates) {
        await ensureEmbeddingsForUser(c.id, c);
      }

      // Fetch all vectors in a single call; on index-missing, fallback to skill-only scoring
      const fetchIds = [ `${userId}-teach`, `${userId}-learn`, ...candidates.flatMap(c => [`${c.id}-teach`, `${c.id}-learn`]) ];
      try {
        const fetchResponse = await safeFetch(fetchIds);
        vectors = fetchResponse.records || fetchResponse.vectors || {};
        userTeachEmbedding = vectors[`${userId}-teach`]?.values || null;
        userLearnEmbedding = vectors[`${userId}-learn`]?.values || null;
      } catch (err) {
        if (err?.code === "INDEX_NOT_FOUND" || String(err.message).includes("index not found")) {
          console.warn("Pinecone index not available at fetch time — falling back to skill-overlap scoring.");
          useEmbeddings = false;
          vectors = {};
          userTeachEmbedding = null;
          userLearnEmbedding = null;
        } else {
          throw err;
        }
      }
    }

    // Score candidates: use embeddings if available, else fallback to skill-overlap
    const scored = candidates.map((c) => {
      if (useEmbeddings) {
        const teachVec = vectors[`${c.id}-teach`]?.values || null;
        const learnVec = vectors[`${c.id}-learn`]?.values || null;

        // Both user and candidate embeddings must exist to use embedding-based scoring
        if (userLearnEmbedding && teachVec && userTeachEmbedding && learnVec) {
          const learnScore = cosineSimilarity(userLearnEmbedding, teachVec);
          const teachScore = cosineSimilarity(userTeachEmbedding, learnVec);
          const finalScore = ((learnScore ?? 0) + (teachScore ?? 0)) / 2;
          return { userId: c.id, name: c.name || "Unnamed", method: "embedding", learnScore, teachScore, finalScore };
        }
      }

      // Fallback: skill overlap scoring (Jaccard)
      const learnScore = jaccard(user.learnSkills || [], c.teachSkills || []);
      const teachScore = jaccard(user.teachSkills || [], c.learnSkills || []);
      const finalScore = (learnScore + teachScore) / 2;
      return { userId: c.id, name: c.name || "Unnamed", method: "skill-overlap", learnScore, teachScore, finalScore };
    });

    const finalResults = scored.filter(s => s.finalScore && s.finalScore > 0).sort((a, b) => b.finalScore - a.finalScore).slice(0, 10);

    if (!finalResults.length) {
      return res.status(200).json({ matches: [], hint: "No matches found. Ensure users have skills defined." });
    }

    return res.status(200).json({ matches: finalResults });

  } catch (error) {
    console.error("❌ Error in search-profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

