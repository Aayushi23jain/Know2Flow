import { io } from "socket.io-client";
import fetch from "node-fetch"; // npm install node-fetch
import { admin } from "./firebase.js"; // your existing firebase.js

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const EMAIL = "aayushijain.jain23@gmail.com";           // replace with test user
const PASSWORD = "aayu123";     // replace with test password
const RECEIVER_UID = "W4d1GR4lQ6XV5opgGlynuyIn4ch1"; // replace with another user UID for testing

async function testSocket() {
  try {
    console.log("⏳ Logging in to Firebase...");

    // Step 1: Firebase REST login
    const loginRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: EMAIL,
          password: PASSWORD,
          returnSecureToken: true,
        }),
      }
    );

    const loginData = await loginRes.json();

    if (!loginData.idToken) {
      throw new Error("Failed to get idToken. Check email/password and API key.");
    }

    console.log("🟡 idToken length:", loginData.idToken.length);

    // Step 2: Create Firebase session cookie
    const expiresIn = 5 * 24 * 60 * 60 * 1000; // 5 days
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(loginData.idToken, { expiresIn });

    console.log("🟢 sessionCookie length:", sessionCookie.length);

    // Step 3: Connect to Socket.IO backend
    const socket = io("http://localhost:5000", {
      extraHeaders: {
        Cookie: `session=${sessionCookie}`,
      },
    });

    socket.on("connect", () => {
      console.log("✅ Connected to backend:", socket.id);

      // Send test message
      socket.emit("sendMessage", {
        receiverId: RECEIVER_UID,
        text: "Test message from backend",
      });
    });

    socket.on("receiveMessage", (msg) => {
      console.log("📩 Message received:", msg);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Connection error:", err.message);
    });
  } catch (err) {
    console.error("🔥 Test failed:", err.message);
  }
}

testSocket();
