import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai"; // ✅ use this instead
import dotenv from "dotenv";
dotenv.config();

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.Index("users-skills");

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to generate embedding for skills
export async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "embedding-001" }); // ✅ correct
  const result = await model.embedContent(text);

  // result.embedding.values is the vector
  return result.embedding.values;
}

export { index };
