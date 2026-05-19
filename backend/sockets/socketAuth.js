import { admin } from "../firebase.js";

const socketAuth = async (socket, next) => {
  try {
    let sessionCookie = null;
    
    // Try to get from cookies first
    const cookieHeader = socket.handshake.headers.cookie;
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split("; ").map(c => c.split("="))
      );
      sessionCookie = cookies.session;
    }

    // If no cookie, try Authorization header
    if (!sessionCookie) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        sessionCookie = authHeader.substring(7);
      }
    }

    if (!sessionCookie) {
      return next(new Error("Unauthorized: No session token"));
    }

    // Verify Firebase session cookie
    const decodedClaims = await admin
      .auth()
      .verifySessionCookie(sessionCookie, true);

    // Attach user to socket
    socket.user = {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
    };

    next();
  } catch (err) {
    console.error("Socket auth failed:", err.message);
    next(new Error("Unauthorized"));
  }
};

export default socketAuth;
