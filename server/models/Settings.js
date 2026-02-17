import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    // Only one settings document should ever exist (singleton)
    singleton: {
      type: String,
      default: "global",
      unique: true,
    },

    electionPeriod: {
      startDate: { type: String, default: "" },
      startTime: { type: String, default: "" },
      endDate: { type: String, default: "" },
      endTime: { type: String, default: "" },
    },

    positions: {
      type: [String],
      default: [],
    },

    // Store the passcode as plain text.
    // If you want it hashed, swap to bcrypt like the Admin model.
    votingPasscode: {
      type: String,
      default: "123456",
      minlength: 4,
    },
  },
  { timestamps: true },
);

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
