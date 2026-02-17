import express from "express";
import { uploadToR2 } from "../config/r2.js";
import {
  getCandidates,
  addCandidate,
  updateCandidate,
  deleteCandidate,
  deleteAllCandidates,
} from "../controllers/candidates.js";

const router = express.Router();

router.get("/", getCandidates);
router.post("/", uploadToR2.single("profilePicture"), addCandidate); // ✅ "profilePicture"
router.put("/:id", uploadToR2.single("profilePicture"), updateCandidate); // ✅ same field name
router.delete("/", deleteAllCandidates);
router.delete("/:id", deleteCandidate);

export default router;
