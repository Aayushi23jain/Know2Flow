import express from "express";
import { admin, db } from "../firebase.js";
import { generateEmbedding, index } from "../pinecone.js";

const router = express.Router();
router.post("/", async (req, res) => {
  console.log("📥 Signup request received:", req.body);

  try {
    const {
      name,
      email,
      password,
      teachSkills,
      learnSkills,
      language,
      experienceLevel,
      country
    } = req.body;

    // 🛑 Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("🔥 Creating Firebase user...");
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
    console.log("✅ Firebase user created:", userRecord.uid);

    console.log("💾 Saving user to Firestore...");
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
    console.log("✅ Firestore saved");

    // 🛑 Prevent Pinecone crash if skills are empty
    const teachText = Array.isArray(teachSkills) ? teachSkills.join(", ") : "";
    const learnText = Array.isArray(learnSkills) ? learnSkills.join(", ") : "";

    console.log("🧠 Generating embeddings...");
    const teachEmbedding = teachText ? await generateEmbedding(teachText) : [];
    const learnEmbedding = learnText ? await generateEmbedding(learnText) : [];

    console.log("📌 Embedding lengths:", teachEmbedding.length, learnEmbedding.length);
    try {
  if (teachEmbedding.length && learnEmbedding.length) {
    await index.upsert([
      {
        id: `${userRecord.uid}-teach`,
        values: teachEmbedding,
        metadata: { userId: userRecord.uid, type: "teach" },
      },
      {
        id: `${userRecord.uid}-learn`,
        values: learnEmbedding,
        metadata: { userId: userRecord.uid, type: "learn" },
      },
    ]);
  }
} catch (pineconeError) {
  console.error("⚠️ Pinecone error (ignored):", pineconeError.message);
}

    // if (teachEmbedding.length && learnEmbedding.length) {
    //   console.log("🌲 Upserting into Pinecone...");
    //   await index.upsert([
    //     {
    //       id: `${userRecord.uid}-teach`,
    //       values: teachEmbedding,
    //       metadata: {
    //         userId: userRecord.uid,
    //         type: "teach",
    //         skills: teachSkills,
    //       },
    //     },
    //     {
    //       id: `${userRecord.uid}-learn`,
    //       values: learnEmbedding,
    //       metadata: {
    //         userId: userRecord.uid,
    //         type: "learn",
    //         skills: learnSkills,
    //       },
    //     },
    //   ]);
    //   console.log("✅ Pinecone upsert successful");
    // }

    res.status(201).json({
      message: "User created successfully",
      userId: userRecord.uid,
    });

  } catch (error) {
    console.error("❌ Signup failed:", error);
    res.status(500).json({
      error: "Signup failed",
      details: error.message,
    });
  }
});

// router.post("/", async (req, res) => {
//   try {
//     const { name, email, password, teachSkills, learnSkills, language, experienceLevel, country } = req.body;

//     // Create user in Firebase Auth
//     const userRecord = await admin.auth().createUser({
//       email,
//       password,
//       displayName: name,
//     });
    
//     console.log("✅ Firebase user created:", userRecord.uid);
//     // Store profile in Firestore
//     await db.collection("users").doc(userRecord.uid).set({
//       name,
//       email,
//       teachSkills,
//       learnSkills,
//       language,
//       experienceLevel,
//       country,
//       tokens: 1,
//       createdAt: new Date(),
//     });

//     // 🔹 Generate embeddings
//     const teachEmbedding = await generateEmbedding(teachSkills.join(", "));
//     const learnEmbedding = await generateEmbedding(learnSkills.join(", "));

//     // 🔹 Upsert into Pinecone (correct format)
//     console.log("🟢 Upserting teach embedding:", teachEmbedding.length);
//     console.log("🟢 Upserting learn embedding:", learnEmbedding.length);

//     await index.upsert([
//       {
//         id: `${userRecord.uid}-teach`,
//         values: teachEmbedding,
//         metadata: {
//           userId: userRecord.uid,
//           type: "teach",
//           skills: teachSkills,
//         },
//       },
//       {
//         id: `${userRecord.uid}-learn`,
//         values: learnEmbedding,
//         metadata: {
//           userId: userRecord.uid,
//           type: "learn",
//           skills: learnSkills,
//         },
//       },
//     ]);

//     res.status(201).json({ message: "User created successfully", userId: userRecord.uid });
//   } catch (error) {
//     console.error("❌ Error in signup:", error);
//     res.status(400).json({ error: error.message });
//   }
// });

export default router;
