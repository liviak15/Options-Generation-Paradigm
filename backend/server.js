import "dotenv/config";
import express from "express"; // framework for backend server
import mongoose from "mongoose";
import cors from "cors"; // connect frontend and backend
import responsesRouter from "./routes/responses.js";
import uploadRouter from "./routes/upload.js";        


const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(express.json());


app.use("/api/responses", responsesRouter);
app.use("/api/upload", uploadRouter);


mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Backend running → http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error(err)); // show errore if DB connection fails

