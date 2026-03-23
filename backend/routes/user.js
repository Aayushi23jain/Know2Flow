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
// Get all users (for chat list)
router.get("/", verifyCookie, async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/:userId/addToChat", verifyCookie, async (req, res) => {
  const currentUserId = req.user.uid;
  const otherUserId = req.params.userId;

  try {
    const userRef = db.collection("users").doc(currentUserId);
    await userRef.update({
      chatUsers: admin.firestore.FieldValue.arrayUnion(otherUserId),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get all users you have chats with
router.get("/me/chats", verifyCookie, async (req, res) => {
  try {
    const meUid = req.user.uid;

    const userDoc = await db.collection("users").doc(meUid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

    // chatUsers is an array of UIDs you have chatted with
    const chatUsers = userDoc.data().chatUsers || [];

    // fetch their basic info
    const usersData = [];
    for (let uid of chatUsers) {
      const docSnap = await db.collection("users").doc(uid).get();
      if (docSnap.exists) {
        usersData.push({ userId: docSnap.id, name: docSnap.data().name });
      }
    }

    res.json(usersData);
  } catch (err) {
    console.error(err);
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