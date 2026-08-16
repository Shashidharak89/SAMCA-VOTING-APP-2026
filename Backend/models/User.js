const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: String },
  otpExpires: { type: Date },
  hasVoted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Indexes to speed up OTP validation and voting status checks
// Compound index for OTP lookups (email already unique)
userSchema.index({ otp: 1, otpExpires: 1 });
// TTL index so expired OTP docs are cleaned automatically (expires at otpExpires)
userSchema.index(
  { otpExpires: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { otpExpires: { $exists: true } } }
);
// Quick filter for users who haven't voted / have voted
userSchema.index({ hasVoted: 1 });

module.exports = mongoose.model("User", userSchema);
