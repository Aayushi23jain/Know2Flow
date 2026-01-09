import { admin } from "../firebase.js";

const socketAuth = async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
      return next(new Error("Unauthorized: No cookies"));
    }

    // Parse cookies safely
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map(c => c.split("="))
    );

    const sessionCookie = cookies.session;

    if (!sessionCookie) {
      return next(new Error("Unauthorized: No session cookie"));
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
