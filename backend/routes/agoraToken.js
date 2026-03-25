import express from "express";
import pkg from "agora-access-token";

const { RtcTokenBuilder, RtcRole } = pkg;

const router = express.Router();

router.post("/generate-token", (req, res) => {
  try {
    const { channelName, uid } = req.body;

    if (!channelName) {
      return res.status(400).json({ error: "Channel name required" });
    }

    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appID || !appCertificate) {
      return res.status(500).json({
        error: "Agora credentials missing in environment variables",
      });
    }

    console.log("Backend AppID:", appID);

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
  appID,
  appCertificate,
  channelName,
  uid,
  role,
  privilegeExpiredTs
);


    return res.json({ token });
  } catch (error) {
    console.error("Token generation error:", error);
    return res.status(500).json({ error: "Failed to generate token" });
  }
});

export default router;

