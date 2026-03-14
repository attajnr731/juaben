import Settings from "../models/Settings.js";
import Candidate from "../models/Candidate.js";
import Voter from "../models/Voter.js";
import Setting from "../models/Settings.js";

// ── Helper: always get-or-create the single settings doc ──
const getOrCreate = () =>
  Settings.findOneAndUpdate(
    { singleton: "global" },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

// GET /api/settings
export const getSettings = async (req, res) => {
  try {
    const settings = await getOrCreate();
    return res.status(200).json(settings);
  } catch (err) {
    console.error("getSettings error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/settings/period
export const updatePeriod = async (req, res) => {
  try {
    const { startDate, startTime, endDate, endTime } = req.body;

    if (!startDate || !startTime || !endDate || !endTime)
      return res
        .status(400)
        .json({ message: "All date/time fields are required." });

    // Basic order check
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    if (end <= start)
      return res
        .status(400)
        .json({ message: "End date/time must be after start." });

    const settings = await Settings.findOneAndUpdate(
      { singleton: "global" },
      { electionPeriod: { startDate, startTime, endDate, endTime } },
      { upsert: true, new: true },
    );

    return res.status(200).json({
      message: "Election period saved.",
      electionPeriod: settings.electionPeriod,
    });
  } catch (err) {
    console.error("updatePeriod error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/settings/positions
export const updatePositions = async (req, res) => {
  try {
    const { positions } = req.body;

    if (!Array.isArray(positions))
      return res.status(400).json({ message: "Positions must be an array." });

    const cleaned = positions.map((p) => p.trim()).filter(Boolean);

    const settings = await Settings.findOneAndUpdate(
      { singleton: "global" },
      { positions: cleaned },
      { upsert: true, new: true },
    );

    return res
      .status(200)
      .json({ message: "Positions updated.", positions: settings.positions });
  } catch (err) {
    console.error("updatePositions error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/settings/passcode
export const updatePasscode = async (req, res) => {
  try {
    const { passcode } = req.body;

    if (!passcode || passcode.length < 4)
      return res
        .status(400)
        .json({ message: "Passcode must be at least 4 characters." });

    await Settings.findOneAndUpdate(
      { singleton: "global" },
      { votingPasscode: passcode },
      { upsert: true, new: true },
    );

    return res.status(200).json({ message: "Passcode updated successfully." });
  } catch (err) {
    console.error("updatePasscode error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteElectionData = async (req, res) => {
  try {
    await Promise.all([Candidate.deleteMany({}), Voter.deleteMany({})]);

    // Clear positions from settings
    await Settings.updateOne({}, { $set: { positions: [] } });

    res.json({
      message: "All candidates, voters, and positions have been deleted.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete election data." });
  }
};

// ─────────────────────────────────────
// POST /api/settings/otp/generate
// Admin generates one 5-char alphanumeric OTP
// ─────────────────────────────────────
export const generateOtp = async (req, res) => {
  try {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const codes = [];

    for (let j = 0; j < 10; j++) {
      let code = "";
      for (let i = 0; i < 5; i++)
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      codes.push({ code, used: false, createdAt: new Date() });
    }

    await Settings.findOneAndUpdate(
      { singleton: "global" },
      { $push: { otps: { $each: codes } } }, // $each pushes all 10 at once
      { upsert: true, new: true },
    );

    return res
      .status(201)
      .json({ message: "OTPs generated.", codes: codes.map((c) => c.code) });
  } catch (err) {
    console.error("generateOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────
// GET /api/settings/otps
// Returns all OTPs (admin view)
// ─────────────────────────────────────
export const getOtps = async (req, res) => {
  try {
    const settings = await getOrCreate();
    return res.status(200).json({ otps: settings.otps || [] });
  } catch (err) {
    console.error("getOtps error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────
// DELETE /api/settings/otps/used
// Clears all used OTPs to keep the list clean
// ─────────────────────────────────────
export const clearUsedOtps = async (req, res) => {
  try {
    await Settings.findOneAndUpdate(
      { singleton: "global" },
      { $pull: { otps: { used: true } } },
    );
    return res.status(200).json({ message: "Used OTPs cleared." });
  } catch (err) {
    console.error("clearUsedOtps error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
