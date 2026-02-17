import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    position: {
      type: String,
      required: true,
      trim: true,
    },

    profilePicture: {
      type: String,
      default: "",
    },

    voteCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Candidate = mongoose.model("Candidate", candidateSchema);
export default Candidate;
