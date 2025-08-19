import express from "express";
import { admin, db } from "../firebase.js";

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

    // Store extra profile info in Firestore
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

    res.status(201).json({ message: "User created successfully", userId: userRecord.uid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
