import Voter from "../models/Voter.js";

// ─────────────────────────────────────
// GET /api/voters
// Returns all voters, optional ?search=
// ─────────────────────────────────────
export const getVoters = async (req, res) => {
  try {
    const { search } = req.query;

    const query = search
      ? {
          $or: [
            { studentId: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const voters = await Voter.find(query).sort({ createdAt: -1 });
    return res.status(200).json(voters);
  } catch (err) {
    console.error("getVoters error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────
// POST /api/voters
// Add a single voter
// Body: { studentId, name }
// ─────────────────────────────────────
export const addVoter = async (req, res) => {
  try {
    const { studentId, name } = req.body;

    if (!studentId || !name)
      return res
        .status(400)
        .json({ message: "studentId and name are required." });

    const existing = await Voter.findOne({ studentId: studentId.trim() });
    if (existing)
      return res
        .status(400)
        .json({ message: `Student ID "${studentId}" already exists.` });

    const voter = await Voter.create({
      studentId: studentId.trim(),
      name: name.trim(),
    });

    return res
      .status(201)
      .json({ message: "Voter added successfully.", voter });
  } catch (err) {
    console.error("addVoter error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────
// POST /api/voters/bulk
// Bulk import voters from parsed Excel/CSV data
// Body: { voters: [{ studentId, name }] }
// Duplicates are skipped, not rejected
// ─────────────────────────────────────
export const bulkAddVoters = async (req, res) => {
  try {
    const { voters } = req.body;

    if (!Array.isArray(voters) || voters.length === 0)
      return res
        .status(400)
        .json({ message: "Provide a non-empty voters array." });

    // Validate each row has the required fields
    const invalid = voters.filter((v) => !v.studentId || !v.name);
    if (invalid.length)
      return res.status(400).json({
        message: `${invalid.length} row(s) are missing studentId or name.`,
      });

    // Use insertMany with ordered: false so duplicate-key errors don't stop the whole batch
    const docs = voters.map((v) => ({
      studentId: String(v.studentId).trim(),
      name: String(v.name).trim(),
      hasVoted: false,
    }));

    const result = await Voter.insertMany(docs, { ordered: false }).catch(
      (err) => {
        // insertMany with ordered:false throws a BulkWriteError but still inserts the valid docs
        if (err.code === 11000 || err.name === "BulkWriteError") {
          return err.result; // partial success — return what was inserted
        }
        throw err;
      },
    );

    const insertedCount =
      result?.nInserted ??
      result?.insertedCount ??
      (Array.isArray(result) ? result.length : 0);

    return res.status(201).json({
      message: `Imported successfully. ${insertedCount} new voter(s) added; duplicates were skipped.`,
      insertedCount,
    });
  } catch (err) {
    console.error("bulkAddVoters error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────
// DELETE /api/voters/:id
// Delete a single voter by MongoDB _id
// ─────────────────────────────────────
export const deleteVoter = async (req, res) => {
  try {
    const voter = await Voter.findByIdAndDelete(req.params.id);
    if (!voter) return res.status(404).json({ message: "Voter not found." });

    return res.status(200).json({ message: "Voter removed successfully." });
  } catch (err) {
    console.error("deleteVoter error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────
// DELETE /api/voters
// Delete ALL voters
// ─────────────────────────────────────
export const deleteAllVoters = async (req, res) => {
  try {
    const result = await Voter.deleteMany({});
    return res.status(200).json({
      message: `All voters deleted. ${result.deletedCount} record(s) removed.`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("deleteAllVoters error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────
// PATCH /api/voters/:id/vote
// Mark a voter as having voted (called internally during voting)
// ─────────────────────────────────────
export const markVoted = async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id);
    if (!voter) return res.status(404).json({ message: "Voter not found." });

    if (voter.hasVoted)
      return res.status(400).json({ message: "This voter has already voted." });

    voter.hasVoted = true;
    await voter.save();

    return res
      .status(200)
      .json({ message: "Vote recorded successfully.", voter });
  } catch (err) {
    console.error("markVoted error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
