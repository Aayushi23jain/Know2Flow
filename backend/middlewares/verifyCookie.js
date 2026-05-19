// verifyCookie.js
import { admin } from "../firebase.js";

const verifyCookie = async (req, res, next) => {
  try {
    // Try to get session from cookie first
    let sessionCookie = req.cookies.session || "";
    
    // If no cookie, try Authorization header (for cross-domain requests)
    if (!sessionCookie) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        sessionCookie = authHeader.substring(7); // Remove "Bearer " prefix
      }
    }

    if (!sessionCookie) {
      return res.status(401).json({ error: "No session cookie or token found" });
    }

    // Verify session cookie with Firebase
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    req.user = decodedClaims; // attach user info to request for later use
    next(); // pass control to the next middleware/route
  } catch (error) {
    console.error("Cookie verification failed:", error.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export default verifyCookie;
