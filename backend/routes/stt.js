import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import pkg from "agora-access-token";

dotenv.config();
const { RtcTokenBuilder, RtcRole } = pkg;
const router = express.Router();

router.post("/start", async (req, res) => {
  const { channelName, languages } = req.body; // Accept languages from the request body

  if (!channelName) {
    console.error("❌ Error: No channelName provided");
    return res.status(400).json({ error: "channelName is required" });
  }

  const { 
    AGORA_APP_ID, 
    AGORA_APP_CERTIFICATE, 
    AGORA_CUSTOMER_ID, 
    AGORA_CUSTOMER_SECRET 
  } = process.env;

  if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE || !AGORA_CUSTOMER_ID || !AGORA_CUSTOMER_SECRET) {
    console.error("❌ Error: Environment variables are missing!");
    return res.status(500).json({ error: "Server Configuration Error" });
  }

  // --- 1. GENERATE TOKENS FOR THE BOT ---
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Token for the subBot (hears audio) - UID 999
  const subToken = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID, AGORA_APP_CERTIFICATE, channelName, 999, RtcRole.PUBLISHER, privilegeExpiredTs
  );

  // Token for the pubBot (sends text data) - UID 1010
  const pubToken = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID, AGORA_APP_CERTIFICATE, channelName, 1010, RtcRole.PUBLISHER, privilegeExpiredTs
  );

  // --- 2. PREPARE AUTHENTICATION ---
  const auth = Buffer.from(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`).toString("base64");

  // Use provided languages or default to English and Hindi
  const sttLanguages = Array.isArray(languages) && languages.length > 0 ? languages : ["en-US", "hi-IN"];

  try {
    const response = await axios.post(
      `https://api.agora.io/api/speech-to-text/v1/projects/${AGORA_APP_ID}/join`,
      {
        "name": "Know2Flow-STT-Bot",
        "languages": sttLanguages, // Dynamic languages
        "rtcConfig": {
          "channelName": channelName,
          "subBotUid": "999",
          "subBotToken": subToken, // <-- ADDED TOKEN
          "pubBotUid": "1010",
          "pubBotToken": pubToken   // <-- ADDED TOKEN
        }
      },
      {
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Success! Bot joined channel: ${channelName} with Tokens`);
    res.json({ success: true, agentId: response.data.agent_id });

  } catch (error) {
    const errorData = error.response?.data;

    // If the task is already running, just tell the frontend "All Good"
    if (errorData?.reason === "TaskConflict" || errorData?.message?.includes("conflict")) {
      console.log("ℹ️ Bot already active in this channel. Proceeding...");
      return res.json({ success: true, message: "Bot already running" });
    }

    console.error("❌ Agora API Error:", errorData || error.message);
    res.status(500).json({ error: "STT Failed", detail: errorData });
  }
});

export default router;