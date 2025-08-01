import { Router } from "express"; // handling routes
import multer from "multer"; // file uploads
import path from "path"; // file extensions
import { createResponse, transcribeAudio } from "../controllers/responseController.js";


const router = Router();

const storage = multer.diskStorage({ //storage for uploaded audio
  destination: "uploads/",
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);// get file extension
    cb(null, Date.now() + ext); 
  },
});
const upload = multer({ storage });


router.post("/", upload.single("audio"), async (req, res) => {
  try { //route for uploading and transcribing
    const { athleteId, videoId } = req.body;

    const transcript = await transcribeAudio(req.file.path); // this must return actual text
     console.log("Whisper transcript output:", transcript);

    if (!transcript || transcript.trim() === "") {
      return res.status(400).json({ message: "Transcription failed or empty" });
    }

    req.body = { athleteId, videoId, transcript };
    await createResponse(req, res);

    console.log("Uploaded file stored at:", req.file.path);
    // fs.unlink(req.file.path, () => {});   // Optional: auto-delete after use

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Transcription failed" });
  }
});

export default router;

