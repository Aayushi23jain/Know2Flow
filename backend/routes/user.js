// backend/routes/user.js
import express from "express";
import { db } from "../firebase.js";
import verifyCookie from "../middlewares/verifyCookie.js";
import { FieldValue } from "firebase-admin/firestore";

const router = express.Router();


router.get("/me", verifyCookie, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) return res.status(404).json({ error: "User not found" });

    res.json({ userId: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error in /user/me:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


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


router.put("/:userId", verifyCookie, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    if (uid !== req.params.userId) {
      return res.status(403).json({ error: "Forbidden: cannot edit another user's profile" });
    }

    const allowed = ["name", "teachSkills", "learnSkills", "experienceLevel", "country", "language"];
    const updates = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No updatable fields provided" });
    }

    updates.updatedAt = new Date();
    const skillsChanged =
      "teachSkills" in updates || "learnSkills" in updates;

    if (skillsChanged) {
      updates.embeddingsStatus = "pending";
    }

    await db.collection("users").doc(req.params.userId).update(updates);

    const updated = await db.collection("users").doc(req.params.userId).get();
    res.json({ userId: updated.id, ...updated.data() });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Block/report a user
router.post("/:userId/block", verifyCookie, async (req, res) => {
  try {
    const currentUserId = req.user.uid; // from verifyCookie
    const toBlockId = req.params.userId;

    if (currentUserId === toBlockId) {
      return res.status(400).json({ error: "You cannot block yourself." });
    }

    const userRef = db.collection("users").doc(currentUserId);

    await userRef.update({
      blockedUsers: FieldValue.arrayUnion(toBlockId),
    });

    res.json({ success: true, message: "User blocked successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to block user." });
  }
});

export default router;