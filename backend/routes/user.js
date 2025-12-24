// backend/routes/user.js
import express from "express";
import { db } from "../firebase.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.params.userId).get();
    if (!doc.exists) return res.status(404).json({ error: "User not found" });
    res.json({ userId: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;