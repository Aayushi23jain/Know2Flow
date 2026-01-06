import express from "express";
import { db } from "../firebase.js";
import verifyCookie from "../middlewares/verifyCookie.js";

const router = express.Router();

/**
 * GET /chat/:otherUserId
 * Returns chat messages between logged-in user and other user
 */
router.get("/:otherUserId", verifyCookie, async (req, res) => {
  try {
    const me = req.user.uid;
    const other = req.params.otherUserId;

    const chatId = [me, other].sort().join("_");

    const snapshot = await db
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .limit(50)
      .get();

    const messages = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    }));

    res.json(messages);
  } catch (err) {
    console.error("Chat fetch error:", err.message);
    res.status(500).json({ error: "Failed to load chat" });
  }
});

export default router;
