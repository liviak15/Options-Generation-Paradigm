import { Router } from "express";
import Response from "../models/Response.js";
import {
  createResponse,
  listResponses,
  scoreResponse,
} from "../controllers/responseController.js";

const router = Router();

router.get("/", listResponses); // get all responses


router.post("/", createResponse); //create new response
   

router.patch("/:id", scoreResponse); // update expert score

router.delete("/:id", async (req, res) => { // delete entries
  try {
    const deleted = await Response.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    // 204 No Content = success, nothing to return
    res.sendStatus(204);
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Failed to delete entry" });
  }
});

export default router;
