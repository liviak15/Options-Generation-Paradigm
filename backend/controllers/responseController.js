import { spawn } from "child_process"; // run python from Node
import Response from "../models/Response.js";

// function to calculate the similarity between texts
const cosineSimilarity = (a, b) => {
  const wordsA = a.toLowerCase().split(/\s+/);
  const wordsB = b.toLowerCase().split(/\s+/);
  const uniqueWords = [...new Set([...wordsA, ...wordsB])];

  const vecA = uniqueWords.map((word) => wordsA.includes(word) ? 1 : 0);
  const vecB = uniqueWords.map((word) => wordsB.includes(word) ? 1 : 0);

  //used to calculate cosine similarity
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));

  return dotProduct / (magnitudeA * magnitudeB || 1);
}; //this returns similarity score

// salls the Whisper model via Python
export const transcribeAudio = (filePath) =>
  new Promise((resolve) => {
    const py = spawn("python", ["whisper_transcribe.py", filePath]);
    let out = "";
    py.stdout.on("data", (d) => (out += d));
    py.stderr.on("data", (d) => console.error(`whisper stderr: ${d}`));
    py.on("close", () => resolve(out.trim()));
  });

// Creation of new transcript and auto-scoring
export const createResponse = async (req, res) => {
  try {
    const { athleteId, videoId, transcript } = req.body;

    
    const allScored = await Response.find({ expertScore: { $ne: null } }); // Get all expert-scored responses

    const SIMILARITY_THRESHOLD = 0.3;

    const similarEntries = allScored
      .map((r) => ({
        sim: cosineSimilarity(transcript, r.transcript),
        score: r.expertScore,
      }))
      .filter((entry) => entry.sim >= SIMILARITY_THRESHOLD);

    let autoScore = null;
    if (similarEntries.length > 0) { // calc avg score of similar entries
      const total = similarEntries.reduce((sum, e) => sum + e.score, 0);
      autoScore = Math.round(total / similarEntries.length);
    }
    // save new responses in the DB
    const doc = await Response.create({
      athleteId,
      videoId,
      transcript,
      autoScore,
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const listResponses = async (_req, res) => {
  res.json(await Response.find().sort({ createdAt: -1 }));
}; // can get all saved responsses from the DB


export const scoreResponse = async (req, res) => {
  try {
    const updated = await Response.findByIdAndUpdate(
      req.params.id,
      { expertScore: req.body.expertScore },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}; // Allow expert to submit a manual score
