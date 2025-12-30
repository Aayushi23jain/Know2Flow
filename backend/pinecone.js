import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || "users-skills";
const index = pinecone.Index(INDEX_NAME);

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate an embedding vector for `text`.
 * Returns an array of numbers (unit-normalized by default) or [] for empty input.
 */
export async function generateEmbedding(text, { normalize = true, retries = 2 } = {}) {
  if (!text || !String(text).trim()) return [];
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }

  const model = genAI.getGenerativeModel({ model: "embedding-001" });
  let attempt = 0;

  while (true) {
    try {
      const result = await model.embedContent(String(text));
      const values = result?.embedding?.values;

      if (!Array.isArray(values) || values.length === 0 || !values.every(v => typeof v === "number")) {
        throw new Error("Invalid embedding returned from Gemini");
      }

      if (normalize) {
        const norm = Math.sqrt(values.reduce((s, v) => s + v * v, 0)) || 1;
        return values.map(v => v / norm);
      }

      return values;
    } catch (err) {
      if (attempt >= retries) throw err;
      attempt++;
      const wait = Math.round((2 ** attempt) * 100 + Math.random() * 100);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

// Export a flag that is set at startup
export let INDEX_AVAILABLE = false;

(async function verifyIndexExists() {
  try {
    // Use the client-level describeIndex call (not on Index instance)
    await pinecone.describeIndex(INDEX_NAME);
    INDEX_AVAILABLE = true;
    console.log(`✅ Pinecone index "${INDEX_NAME}" found`);
  } catch (err) {
    INDEX_AVAILABLE = false;
    console.warn(`⚠️ Pinecone index "${INDEX_NAME}" not found or not reachable. Searches will fallback to skill-overlap.`, err?.message || err);
  }
})();

// Safe fetch wrapper
export async function safeFetch(ids) {
  try {
    return await index.fetch(ids);
  } catch (err) {
    if (err?.name === "PineconeNotFoundError" || String(err.message).includes("returned HTTP status 404")) {
      const msg = `Pinecone index "${INDEX_NAME}" not found. Create it or set PINECONE_INDEX_NAME to an existing index.`;
      const e = new Error(msg);
      e.code = "INDEX_NOT_FOUND";
      console.error(msg);
      throw e;
    }
    throw err;
  }
}

export { index };
