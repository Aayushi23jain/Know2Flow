// backend/routes/logout.js
import express from "express";

const router = express.Router();

/**
 * POST /logout
 * Clears the authentication cookie/session for the user.
 * Should be called from the frontend on logout.
 */
router.post("/", (req, res) => {
  // Replace "session" with your actual cookie name if different
  res.clearCookie("session", { path: "/", httpOnly: true, sameSite: "lax" });
  res.status(200).json({ message: "Logged out" });
});

export default router;