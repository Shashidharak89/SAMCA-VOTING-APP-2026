const Position = require('../models/Position');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');

// Get all positions
exports.getPositions = async (req, res) => {
  try {
    const positions = await Position.find({ isActive: true }).sort({ order: 1 });
    res.json({ positions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching positions', error: error.message });
  }
};

// Add new position (admin only)
exports.addPosition = async (req, res) => {
  try {
    const { name, displayName, order } = req.body;
    if (!name || !displayName) {
      return res.status(400).json({ message: 'Name and display name are required' });
    }
    
    const position = await Position.create({ name, displayName, order: order || 0 });
    res.json({ message: 'Position added successfully', position });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Position already exists' });
    } else {
      res.status(500).json({ message: 'Error adding position', error: error.message });
    }
  }
};

// Update position (admin only)
exports.updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, displayName, isActive, order } = req.body;
    
    const position = await Position.findByIdAndUpdate(
      id, 
      { name, displayName, isActive, order }, 
      { new: true, runValidators: true }
    );
    
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }
    
    res.json({ message: 'Position updated successfully', position });
  } catch (error) {
    res.status(500).json({ message: 'Error updating position', error: error.message });
  }
};

// Delete position (admin only)
exports.deletePosition = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if any candidates are using this position
    const candidatesCount = await Candidate.countDocuments({ position: id });
    if (candidatesCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete position. ${candidatesCount} candidates are registered for this position.` 
      });
    }
    
    const position = await Position.findByIdAndDelete(id);
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }
    
    res.json({ message: 'Position deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting position', error: error.message });
  }
};

// Get voting analytics/histogram data
exports.getVotingAnalytics = async (req, res) => {
  try {
    const positions = await Position.find({ isActive: true }).sort({ order: 1 });
    const analytics = [];

    for (const position of positions) {
      // Support both internal name and displayName for backward compatibility
      const positionNames = [position.name, position.displayName];
      // Get all approved candidates for this position (by either name)
      const candidates = await Candidate.find({ position: { $in: positionNames }, status: 'approved' });
      const candidateIds = candidates.map(c => c._id);

      // Aggregate vote counts for all candidates in this position in one query (by either name)
      const voteCounts = await Vote.aggregate([
        { $unwind: "$votes" },
        { $match: { "votes.position": { $in: positionNames }, "votes.candidate": { $in: candidateIds } } },
        { $group: { _id: "$votes.candidate", count: { $sum: 1 } } }
      ]);

      // Map candidateId to count
      const voteCountMap = {};
      voteCounts.forEach(vc => { voteCountMap[vc._id.toString()] = vc.count; });

      const candidateVotes = candidates.map(c => ({
        candidateId: c._id,
        candidateName: c.name,
        candidateUsn: c.usn,
        voteCount: voteCountMap[c._id.toString()] || 0
      }));

      candidateVotes.sort((a, b) => b.voteCount - a.voteCount);

      analytics.push({
        position: position.name,
        positionDisplay: position.displayName,
        totalCandidates: candidates.length,
        totalVotes: candidateVotes.reduce((sum, c) => sum + c.voteCount, 0),
        candidateVotes
      });
    }

    res.json({ analytics });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

// Get detailed analytics for a specific position
exports.getPositionAnalytics = async (req, res) => {
  try {
    const { positionName } = req.params;
    // Find position by internal name or displayName
    const position = await Position.findOne({ $or: [ { name: positionName }, { displayName: positionName } ], isActive: true });
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }

    // Support both internal name and displayName for backward compatibility
    const positionNames = [position.name, position.displayName];
    // Get all approved candidates for this position (by either name)
    const candidates = await Candidate.find({ position: { $in: positionNames }, status: 'approved' });
    const candidateIds = candidates.map(c => c._id);

    // Aggregate vote counts and voter details for all candidates in this position (by either name)
    const voteAgg = await Vote.aggregate([
      { $unwind: "$votes" },
      { $match: { "votes.position": { $in: positionNames }, "votes.candidate": { $in: candidateIds } } },
      { $group: {
        _id: "$votes.candidate",
        count: { $sum: 1 },
        voters: { $push: "$user" },
      } }
    ]);

    // Map candidateId to count and voters
    const voteMap = {};
    voteAgg.forEach(vc => {
      voteMap[vc._id.toString()] = { count: vc.count, voters: vc.voters };
    });

    // Get voter emails for all involved users
    let allVoterIds = [];
    voteAgg.forEach(vc => { allVoterIds = allVoterIds.concat(vc.voters); });
    let voterEmailMap = {};
    if (allVoterIds.length > 0) {
      const User = require('../models/User');
      const users = await User.find({ _id: { $in: allVoterIds } }).select('_id email');
      users.forEach(u => { voterEmailMap[u._id.toString()] = u.email; });
    }

    const candidateAnalytics = candidates.map(c => {
      const v = voteMap[c._id.toString()] || { count: 0, voters: [] };
      return {
        candidate: {
          id: c._id,
          name: c.name,
          usn: c.usn,
          email: c.email,
          photoUrl: c.photoUrl
        },
        voteCount: v.count,
        votes: v.voters.map(uid => ({
          voterId: uid,
          voterEmail: voterEmailMap[uid.toString()] || '',
          // timestamp not available in aggregation, could be added if needed
        }))
      };
    });

    candidateAnalytics.sort((a, b) => b.voteCount - a.voteCount);

    res.json({
      position: {
        name: position.name,
        displayName: position.displayName
      },
      totalCandidates: candidates.length,
      totalVotes: candidateAnalytics.reduce((sum, c) => sum + c.voteCount, 0),
      candidateAnalytics
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching position analytics', error: error.message });
  }
};
