import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  // @ts-ignore - The SDK might not expose listModels directly but the REST API does, wait.
  // Actually, listModels is available in newer SDKs as `genAI.listModels()`.
  // Let's use the native fetch if the SDK doesn't expose it.
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  console.log(JSON.stringify(data.models.map(m => m.name), null, 2));
}

run().catch(console.error);
