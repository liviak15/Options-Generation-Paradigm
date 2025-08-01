import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs';

// import response model
import Response from '../models/Response.js';

// Compute cosine similarity between two embeddings
function cosineSimilarity(v1, v2) {
  const dotProduct = tf.dot(v1, v2).dataSync()[0];
  const norm1 = tf.norm(v1).dataSync()[0];
  const norm2 = tf.norm(v2).dataSync()[0];
  return dotProduct / (norm1 * norm2);
}

// Main function to get similarity-based auto score
export async function getSimilarityScore(inputText) {
  try {
    const model = await use.load();

    // Get all previous expert-scored responses
    const scored = await Response.find({ expertScore: { $ne: null } });

    if (scored.length === 0) return null;

    const sentences = [inputText, ...scored.map((r) => r.transcript)];
    const embeddings = await model.embed(sentences);

    const inputVec = embeddings.slice([0, 0], [1]);
    const others = embeddings.slice([1, 0]);

    let maxSim = -1;
    let bestScore = null;

    const otherArr = tf.unstack(others);
    for (let i = 0; i < otherArr.length; i++) {
      const sim = cosineSimilarity(inputVec, otherArr[i]);
      if (sim > maxSim) {
        maxSim = sim;
        bestScore = scored[i].expertScore;
      }
    }

    return bestScore;
  } catch (err) {
    console.error("Auto scorer error:", err);
    return null;
  }
}
