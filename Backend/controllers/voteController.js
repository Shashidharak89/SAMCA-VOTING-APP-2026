const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");
const User = require("../models/User");
const Settings = require("../models/Settings");
const Position = require("../models/Position");

exports.getPositionsAndCandidates = async (req, res) => {
  try {
    const positions = await Position.find({ isActive: true }).sort({ order: 1 });
    const candidates = await Candidate.find({ status: "approved" });

    res.json({
      positions: positions.map((p) => p.displayName),
      candidates: candidates.map((c) => ({
        _id: c._id,
        name: c.name,
        position: c.position,
        photoUrl: c.photoUrl,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching positions and candidates", error: error.message });
  }
};

exports.submitVote = async (req, res) => {
  const { votes } = req.body; // votes: [{ position, candidateId }]
  const email = req.user?.email; // provided by auth middleware
  const start = Date.now();
  if (!email) {
    console.log("[vote][submitVote] 401 Unauthorized");
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await User.findOne({ email });
  if (!user || user.hasVoted) {
    console.log("[vote][submitVote] 403 Already voted or user not found", { email });
    return res.status(403).json({ message: "Already voted or user not found." });
  }
  // Validate votes
  if (!Array.isArray(votes) || votes.length === 0) {
    console.log("[vote][submitVote] 400 No votes submitted", { email });
    return res.status(400).json({ message: "No votes submitted." });
  }
  try {
    await Vote.create({
      user: user._id,
      votes: votes.map((v) => ({ position: v.position, candidate: v.candidateId })),
    });
    user.hasVoted = true;
    await user.save();
    const duration = Date.now() - start;
    console.log("[vote][submitVote] 200 Vote submitted", { email, durationMs: duration });
    res.json({ message: "Vote submitted successfully." });
  } catch (err) {
    console.error("[vote][submitVote] 500 Error submitting vote", { email, error: err.message });
    res.status(500).json({ message: "Error submitting vote", error: err.message });
  }
};
