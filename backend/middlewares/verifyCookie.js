// verifyCookie.js
import { admin } from "../firebase.js";

const verifyCookie = async (req, res, next) => {
  try {
    const sessionCookie = req.cookies.session || "";

    if (!sessionCookie) {
      return res.status(401).json({ error: "No session cookie found" });
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
