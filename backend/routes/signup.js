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
      country,
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
      streak: 0,
      stars: 0,
    });
    console.log("✅ Firestore saved");

    // 🛑 Prevent Pinecone crash if skills are empty
    const teachText = Array.isArray(teachSkills) ? teachSkills.join(", ") : "";
    const learnText = Array.isArray(learnSkills) ? learnSkills.join(", ") : "";

    console.log("🧠 Generating embeddings...");
    const teachEmbedding = teachText ? await generateEmbedding(teachText) : [];
    const learnEmbedding = learnText ? await generateEmbedding(learnText) : [];

    console.log(
      "📌 Embedding lengths:",
      teachEmbedding.length,
      learnEmbedding.length
    );

    async function tryUpsert(userId, upserts, retries = 2) {
      let attempt = 0;
      while (true) {
        try {
          await index.upsert(upserts);
          return true;
        } catch (err) {
          console.error(
            `⚠️ Pinecone upsert attempt ${attempt + 1} failed:`,
            err.message || err
          );
          if (attempt >= retries) {
            return false;
          }
          attempt++;
          await new Promise((r) => setTimeout(r, 200 * 2 ** attempt));
        }
      }
    }

    let upsertSuccess = true;
    try {
      const toUpsert = [];
      if (teachEmbedding.length) {
        toUpsert.push({
          id: `${userRecord.uid}-teach`,
          values: teachEmbedding,
          metadata: {
            userId: userRecord.uid,
            type: "teach",
            skills: teachSkills,
          },
        });
      }
      if (learnEmbedding.length) {
        toUpsert.push({
          id: `${userRecord.uid}-learn`,
          values: learnEmbedding,
          metadata: {
            userId: userRecord.uid,
            type: "learn",
            skills: learnSkills,
          },
        });
      }

      if (toUpsert.length) {
        upsertSuccess = await tryUpsert(userRecord.uid, toUpsert);
      }
    } catch (err) {
      console.error("⚠️ Unhandled Pinecone error:", err);
      upsertSuccess = false;
    }

    // Update Firestore so future tooling knows status
    try {
      await db
        .collection("users")
        .doc(userRecord.uid)
        .update({
          embeddingsStatus: upsertSuccess ? "ready" : "failed",
        });
    } catch (err) {
      console.warn(
        "⚠️ Failed to update embeddingsStatus in Firestore:",
        err.message || err
      );
    }

    // --- AUTO-LOGIN: create session cookie after signup ---
    try {
      // Step 1: Sign in with Firebase REST API to get idToken
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.idToken) {
        throw new Error(
          data?.error?.message || "Failed to sign in after signup"
        );
      }
      // Step 2: Create a session cookie from idToken
      const expiresIn = 5 * 60 * 60 * 1000; // 5 hours
      const sessionCookie = await admin
        .auth()
        .createSessionCookie(data.idToken, { expiresIn });
      // Step 3: Set session cookie in response
      const options = {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      };
      res.cookie("session", sessionCookie, options);
    } catch (err) {
      console.error("Failed to auto-login after signup:", err.message || err);
      // Do not block signup, just warn
    }

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
