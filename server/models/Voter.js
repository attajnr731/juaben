import mongoose from "mongoose";

const voterSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    hasVoted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Voter = mongoose.model("Voter", voterSchema);
export default Voter;
