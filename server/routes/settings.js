import express from "express";
import {
  getSettings,
  updatePeriod,
  updatePositions,
  updatePasscode,
  deleteElectionData,
} from "../controllers/settings.js";

const router = express.Router();

router.get("/", getSettings);
router.put("/period", updatePeriod);
router.put("/positions", updatePositions);
router.put("/passcode", updatePasscode);
router.delete("/election-data", deleteElectionData);

export default router;
