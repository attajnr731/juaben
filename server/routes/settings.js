import express from "express";
import {
  getSettings,
  updatePeriod,
  updatePositions,
  updatePasscode,
  deleteElectionData,
  generateOtp,
  getOtps,
  clearUsedOtps,
} from "../controllers/settings.js";

const router = express.Router();

router.get("/", getSettings);
router.put("/period", updatePeriod);
router.put("/positions", updatePositions);
router.put("/passcode", updatePasscode);
router.delete("/election-data", deleteElectionData);
// routes/settings.js  (add these 3 lines alongside your existing routes)
import {} from "../controllers/settings.js";

router.post("/otp/generate", generateOtp);
router.get("/otps", getOtps);
router.delete("/otps/used", clearUsedOtps);

export default router;
