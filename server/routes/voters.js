import express from "express";
import {
  getVoters,
  addVoter,
  bulkAddVoters,
  deleteVoter,
  deleteAllVoters,
  markVoted,
  resetAllVoters,
} from "../controllers/voter.js";

const router = express.Router();

router.get("/", getVoters); // GET    /api/voters
router.post("/", addVoter); // POST   /api/voters
router.post("/bulk", bulkAddVoters); // POST   /api/voters/bulk
router.delete("/", deleteAllVoters); // DELETE /api/voters
router.post("/reset", resetAllVoters); // POST /api/voters/reset
router.delete("/:id", deleteVoter); // DELETE /api/voters/:id
router.patch("/:id/vote", markVoted); // PATCH  /api/voters/:id/vote

export default router;
