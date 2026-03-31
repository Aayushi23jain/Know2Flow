import express from "express";
import axios from "axios";

const router = express.Router();

function isHindi(text) {
  return /[\u0900-\u097F]/.test(text);
}

function isEnglish(text) {
  return /^[a-zA-Z0-9\s.,!?'"()-]+$/.test(text);
}

router.post("/", async (req, res) => {
  try {
    let text = req.body?.text;

    if (!text) {
      return res.status(400).json({ error: "Text required" });
    }

    text = text.trim();

    // ✅ CASE 1: If English → return as it is (NO TRANSLATION)
    if (isEnglish(text) && !isHindi(text)) {
      return res.json({ translated: text });
    }

    const sourceLang = isHindi(text) ? "hi" : "en";
    const targetLang = sourceLang === "hi" ? "en" : "hi";

    const response = await axios.get(
      "https://api.mymemory.translated.net/get",
      {
        params: {
          q: text,
          langpair: `${sourceLang}|${targetLang}`,
        },
      }
    );

    let translated =
      response.data?.responseData?.translatedText || text;

    // cleanup
    translated = translated
      .replace(/[\u200E\u200F\u202A-\u202E]/g, "")
      .replace(/\b(en|hi|us|in|j)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    res.json({ translated });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Translation failed" });
  }
});

export default router;