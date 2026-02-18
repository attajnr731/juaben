import express from "express";
import { uploadToR2 } from "../config/r2.js";
import {
  getCandidates,
  addCandidate,
  updateCandidate,
  deleteCandidate,
  deleteAllCandidates,
  incrementVote,
} from "../controllers/candidates.js";

const router = express.Router();

router.get("/", getCandidates);
router.post("/", uploadToR2.single("profilePicture"), addCandidate); // ✅ "profilePicture"
router.put("/:id", uploadToR2.single("profilePicture"), updateCandidate); // ✅ same field name
router.delete("/", deleteAllCandidates);
router.delete("/:id", deleteCandidate);
router.patch("/:id/vote", incrementVote); // Increment vote count

export default router;
