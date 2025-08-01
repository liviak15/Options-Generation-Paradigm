import os, sys
from pymongo import MongoClient # connectiong to MongoDB
from sentence_transformers import SentenceTransformer, util

MONGO = os.getenv("MONGODB_URI", "mongodb://localhost:27017/ogp")
db = MongoClient(MONGO).ogp
col = db.responses # stores responses

model = SentenceTransformer("all-MiniLM-L6-v2")

def main(text: str): # main function for calc text similarity
    scored = list(col.find({"expertScore": {"$ne": None}}))
    if not scored:
        print(-1)
        return
    corpus = [d["transcript"] for d in scored]
    scores = [d["expertScore"] for d in scored]
    emb_corpus = model.encode(corpus, convert_to_tensor=True)
    query = model.encode(text, convert_to_tensor=True)
    idx = util.cos_sim(query, emb_corpus)[0].argmax().item()
    print(scores[idx])

if __name__ == "__main__": # run the script from command line
    if len(sys.argv) < 2:
        print(-1)
    else:
        main(sys.argv[1])
