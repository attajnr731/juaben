import Candidate from "../models/Candidate.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "../config/r2.js";

// Helper — extract R2 object key from a full public URL
const keyFromUrl = (url) => {
  try {
    return new URL(url).pathname.slice(1); // strips leading "/"
  } catch {
    return null;
  }
};

// Helper — build the public URL from the R2 key
const publicUrl = (key) => `${process.env.R2_PUBLIC_URL}/${key}`;

// ─────────────────────────────────────
// GET /api/candidates
// ─────────────────────────────────────
export const getCandidates = async (req, res) => {
  try {
    const { position } = req.query;
    const query = position ? { position } : {};
    const candidates = await Candidate.find(query).sort({
      position: 1,
      name: 1,
    });
    return res.status(200).json(candidates);
  } catch (err) {
    console.error("getCandidates error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────
// POST /api/candidates
// Expects multipart field: "profilePicture"
// ─────────────────────────────────────
export const addCandidate = async (req, res) => {
  try {
    const { name, position } = req.body;

    if (!name || !position)
      return res
        .status(400)
        .json({ message: "Name and position are required." });

    // multer-s3 puts the file key on req.file.key
    const profilePicture = req.file ? publicUrl(req.file.key) : "";

    const candidate = await Candidate.create({
      name: name.trim(),
      position: position.trim(),
      profilePicture,
    });

    return res.status(201).json({
      message: "Candidate created successfully.",
      candidate,
    });
  } catch (err) {
    console.error("addCandidate error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────
// PUT /api/candidates/:id
// Expects multipart field: "profilePicture" (optional)
// ─────────────────────────────────────
export const updateCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate)
      return res.status(404).json({ message: "Candidate not found." });

    const { name, position } = req.body;

    if (name) candidate.name = name.trim();
    if (position) candidate.position = position.trim();

    // New image uploaded — delete old one from R2 first
    if (req.file?.key) {
      if (candidate.profilePicture) {
        const oldKey = keyFromUrl(candidate.profilePicture);
        if (oldKey) {
          await r2Client
            .send(
              new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: oldKey,
              }),
            )
            .catch((e) => console.warn("R2 delete warning:", e.message));
        }
      }
      candidate.profilePicture = publicUrl(req.file.key);
    }

    await candidate.save();
    return res
      .status(200)
      .json({ message: "Candidate updated successfully.", candidate });
  } catch (err) {
    console.error("updateCandidate error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────
// DELETE /api/candidates/:id
// ─────────────────────────────────────
export const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate)
      return res.status(404).json({ message: "Candidate not found." });

    if (candidate.profilePicture) {
      const key = keyFromUrl(candidate.profilePicture);
      if (key) {
        await r2Client
          .send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: key,
            }),
          )
          .catch((e) => console.warn("R2 delete warning:", e.message));
      }
    }

    return res.status(200).json({ message: "Candidate deleted successfully." });
  } catch (err) {
    console.error("deleteCandidate error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────
// DELETE /api/candidates  (delete ALL)
// ─────────────────────────────────────
export const deleteAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find({});

    await Promise.allSettled(
      candidates
        .filter((c) => c.profilePicture)
        .map((c) => {
          const key = keyFromUrl(c.profilePicture);
          if (!key) return Promise.resolve();
          return r2Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: key,
            }),
          );
        }),
    );

    const result = await Candidate.deleteMany({});
    return res.status(200).json({
      message: `All candidates deleted. ${result.deletedCount} record(s) removed.`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("deleteAllCandidates error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────
// PATCH /api/candidates/:id/vote
// Increment voteCount by 1
// ─────────────────────────────────────
export const incrementVote = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate)
      return res.status(404).json({ message: "Candidate not found." });

    candidate.voteCount = (candidate.voteCount || 0) + 1;
    await candidate.save();

    return res.status(200).json({ message: "Vote recorded.", candidate });
  } catch (err) {
    console.error("incrementVote error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
