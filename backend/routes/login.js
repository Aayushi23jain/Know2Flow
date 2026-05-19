import express from "express";
import fetch from "node-fetch";
import { admin } from "../firebase.js";
import { db } from "../firebase.js";
const router = express.Router();
function isSameDay(a, b) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}
// POST /login
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  // Clear guard: ensure API key exists
  if (!process.env.FIREBASE_API_KEY) {
    console.error("🔴 Missing FIREBASE_API_KEY env var");
    return res.status(500).json({
      error: "Server misconfiguration",
      details: "Missing FIREBASE_API_KEY. Set it in your backend .env",
    });
  }

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
    console.error("Firebase REST status:", response.status, "body:", data);

    // If Google specifically returned API_KEY_INVALID, return a clear message
    if (
      response.status === 400 &&
      data?.error?.message?.includes("API key not valid")
    ) {
      console.error(
        "🔴 Invalid Firebase API key detected. Check FIREBASE_API_KEY and key restrictions."
      );
      return res.status(502).json({
        error: "Invalid Firebase API key",
        details:
          "Verify FIREBASE_API_KEY env var, the key's project, and API/application restrictions in Google Cloud console.",
      });
    }

    if (data.error) {
      console.error("Firebase login error:", data.error);
      return res.status(400).json({ error: data.error.message });
    }

    const idToken = data.idToken;

    // Step 2: Verify idToken to get user info (UID)
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Step 3: Create a session cookie from idToken
    const expiresIn = 5 * 24 * 60 * 60 * 1000; // 5 days
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });

    // Step 4: Set session cookie in response
    const options = {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true, // ✅ Always true for HTTPS (production)
      sameSite: "none", // ✅ CRITICAL: Allow cross-domain cookies (Firebase → Render)
      encode: String,
    };

    res.cookie("session", sessionCookie, {
      ...options,
      encode: String, // ✅ PREVENT URL ENCODING
    });

    try {
      const userRef = db.collection("users").doc(userId);
      const snap = await userRef.get();
      const now = new Date();
      let newStreak = 1;

      if (snap.exists) {
        const data = snap.data();
        const prev = data.lastLogin
          ? data.lastLogin.toDate
            ? data.lastLogin.toDate()
            : new Date(data.lastLogin)
          : null;
        const prevStreak = data.streak || 0;

        const today = now;
        const yesterday = new Date(now);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);

        if (prev && isSameDay(prev, today)) {
          // already logged in today — don't change streak/stars
          newStreak = prevStreak || 1;
        } else if (prev && isSameDay(prev, yesterday)) {
          // consecutive-day login
          newStreak = (prevStreak || 0) + 1;
        } else {
          // not consecutive -> reset streak, give star for today
          newStreak = 1;
        }
      } else {
        // no doc yet -> create minimal profile
        await userRef.set({
          createdAt: now,
          email: decodedToken.email || null,
          tokens: 1,
        });
      }

      await userRef.update({
        lastLogin: admin.firestore.Timestamp.fromDate(now),
        streak: newStreak,
      });
    } catch (err) {
      console.warn("Failed to update login stats:", err.message || err);
    }
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
