// models/Settings.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  code: { type: String, required: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const settingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: "global", unique: true },

    electionPeriod: {
      startDate: { type: String, default: "" },
      startTime: { type: String, default: "" },
      endDate: { type: String, default: "" },
      endTime: { type: String, default: "" },
    },

    positions: { type: [String], default: [] },
    votingPasscode: { type: String, default: "123456", minlength: 4 },

    // ── NEW ──
    otps: { type: [otpSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("Settings", settingsSchema);
