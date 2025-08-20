import express from "express";
import { admin, db } from "../firebase.js";
import { generateEmbedding, index } from "../pinecone.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, password, teachSkills, learnSkills, language, experienceLevel, country } = req.body;

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Store profile in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      name,
      email,
      teachSkills,
      learnSkills,
      language,
      experienceLevel,
      country,
      tokens: 1,
      createdAt: new Date(),
    });

    // 🔹 Generate embeddings
    const teachEmbedding = await generateEmbedding(teachSkills.join(", "));
    const learnEmbedding = await generateEmbedding(learnSkills.join(", "));

    // 🔹 Upsert into Pinecone (correct format)
    console.log("🟢 Upserting teach embedding:", teachEmbedding.length);
    console.log("🟢 Upserting learn embedding:", learnEmbedding.length);

    await index.upsert([
      {
        id: `${userRecord.uid}-teach`,
        values: teachEmbedding,
        metadata: {
          userId: userRecord.uid,
          type: "teach",
          skills: teachSkills,
        },
      },
      {
        id: `${userRecord.uid}-learn`,
        values: learnEmbedding,
        metadata: {
          userId: userRecord.uid,
          type: "learn",
          skills: learnSkills,
        },
      },
    ]);

    res.status(201).json({ message: "User created successfully", userId: userRecord.uid });
  } catch (error) {
    console.error("❌ Error in signup:", error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
