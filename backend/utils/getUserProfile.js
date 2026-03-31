import { db } from "../firebase.js";

/**
 * Fetch user's teach skills + experience level
 * @param {string} userId
 * @returns {Object} { teachSkills: [], experienceLevel: "" }
 */
export async function getUserProfile(userId) {
  try {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new Error("User not found");
    }

    const userData = userSnap.data();

    return {
      teachSkills: userData.teachSkills || [],
      experienceLevel: userData.experienceLevel || "Beginner",
    };
  } catch (err) {
    console.error("❌ Error fetching user profile:", err.message);
    throw err;
  }
}