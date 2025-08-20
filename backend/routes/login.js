import express from "express";
import fetch from "node-fetch"; // if not installed: npm install node-fetch
import { admin } from "../firebase.js";

const router = express.Router();

// POST /login
router.post("/", async (req, res) => {
  const { email, password } = req.body;

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

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const idToken = data.idToken;

    // Step 2: Verify idToken to get user info (UID)
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Step 3: Create a session cookie from idToken
    const expiresIn = 5 * 60 * 60 * 1000; // 5 hours
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });

    // Step 4: Set session cookie in response
    const options = {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // use true in production
      sameSite: "strict",
    };

    res.cookie("session", sessionCookie, options);

    // Step 5: Send userId back to frontend
    res.status(200).json({
      message: "Login successful ✅",
      userId, // return UID so frontend can store and send in headers
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
