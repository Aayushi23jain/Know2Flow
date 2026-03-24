// import express from "express";
// import pkg from "agora-access-token";

// const { RtcTokenBuilder, RtcRole } = pkg;

// const router = express.Router();

// router.post("/generate-token", (req, res) => {
//   try {
//     const { channelName, uid } = req.body;

//     if (!channelName) {
//       return res.status(400).json({ error: "Channel name required" });
//     }

//     const appID = process.env.AGORA_APP_ID;
//     const appCertificate = process.env.AGORA_APP_CERTIFICATE;

//     if (!appID || !appCertificate) {
//       return res.status(500).json({
//         error: "Agora credentials missing in environment variables",
//       });
//     }

//     console.log("Backend AppID:", appID);

//     const role = RtcRole.PUBLISHER;
//     const expirationTimeInSeconds = 3600;
//     const currentTimestamp = Math.floor(Date.now() / 1000);
//     const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

//     const token = RtcTokenBuilder.buildTokenWithUid(
//   appID,
//   appCertificate,
//   channelName,
//   uid,
//   role,
//   privilegeExpiredTs
// );


//     return res.json({ token });
//   } catch (error) {
//     console.error("Token generation error:", error);
//     return res.status(500).json({ error: "Failed to generate token" });
//   }
// });

// export default router;


import express from "express";
import pkg from "agora-access-token";
import axios from "axios";

const { RtcTokenBuilder, RtcRole } = pkg;
const router = express.Router();

// Helper for Agora API Basic Authentication
const getAgoraAuth = () => {
  const customerId = process.env.AGORA_CUSTOMER_ID;
  const customerSecret = process.env.AGORA_CUSTOMER_SECRET;
  return Buffer.from(`${customerId}:${customerSecret}`).toString("base64");
};

// Helper to generate RTC tokens (Used by both users and the RTT bot)
const generateRtcToken = (channelName, uid) => {
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  return RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );
};

/* ---------------- 1. USER TOKEN GENERATION ---------------- */
router.post("/generate-token", (req, res) => {
  try {
    const { channelName, uid } = req.body;
    if (!channelName) return res.status(400).json({ error: "Channel name required" });

    // Use a fixed UID or 0 for auto-assign
    const token = generateRtcToken(channelName, uid || 0);
    return res.json({ token });
  } catch (error) {
    console.error("Token generation error:", error);
    return res.status(500).json({ error: "Failed to generate token" });
  }
});

/* ---------------- 2. START RTT (TRANSCRIPTION) ---------------- */
router.post("/start-rtt", async (req, res) => {
  const { channelName } = req.body;
  const appId = process.env.AGORA_APP_ID;
  const botUid = 999; // Same UID as used in acquire

  try {
    // A. Generate a token specifically for the RTT Bot
    const botToken = generateRtcToken(channelName, botUid);

    // B. Acquire a resource ID
    const acquire = await axios.post(
      `https://api.agora.io/v1/apps/${appId}/cloud_recording/acquire`,
      {
        cname: channelName,
        uid: botUid.toString(),
        clientRequest: { resourceExpiredHour: 24 }
      },
      { headers: { Authorization: `Basic ${getAgoraAuth()}` } }
    );

    const resourceId = acquire.data.resourceId;

    // C. Start the RTT task
    const start = await axios.post(
      `https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${resourceId}/mode/web_with_transcription/start`,
      {
        cname: channelName,
        uid: botUid.toString(),
        clientRequest: {
          token: botToken, // Passing the generated bot token here
          transcriptionConfig: {
            language: "en-US", // Adjust based on your needs
          }
        }
      },
      { headers: { Authorization: `Basic ${getAgoraAuth()}` } }
    );

    res.json({ sid: start.data.sid, resourceId });
  } catch (error) {
    console.error("RTT Start Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to start RTT" });
  }
});

export default router;