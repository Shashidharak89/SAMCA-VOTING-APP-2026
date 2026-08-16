const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  votes: [
    {
      position: { type: String, required: true },
      candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// Ensure one vote per user quickly
voteSchema.index({ user: 1 }, { unique: true });
// Support querying by candidate inside array (multikey)
voteSchema.index({ "votes.candidate": 1 });
// Support querying/aggregation by position
voteSchema.index({ "votes.position": 1 });
// Time-based queries (e.g., analytics) using createdAt
voteSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Vote", voteSchema);
