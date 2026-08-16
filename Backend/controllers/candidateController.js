
const Candidate = require('../models/Candidate');
const Settings = require('../models/Settings');
const cloudinary = require('../config/cloudinary');

exports.registerCandidate = async (req, res) => {
  try {
    // Check registration due date
    const settings = await Settings.getSettings();
    if (settings.registrationDueDate && new Date() > settings.registrationDueDate) {
      return res.status(403).json({ message: 'Registration deadline has passed' });
    }

    const { name, usn, email, position, phone } = req.body;
    if (!name || !usn || !email || !position || !phone) return res.status(400).json({ message: 'All fields required' });
    const usnNorm = usn.toLowerCase().trim();
    const usnRegex = /^nu25mca(?:[1-9]|[1-9][0-9]|1[0-7][0-9]|180)$/;
    if (!usnRegex.test(usnNorm)) {
      return res.status(400).json({ message: 'Invalid USN format (expected nu25mca1 - nu25mca180)' });
    }

    // Check if candidate already exists with same email or USN
    const existingCandidate = await Candidate.findOne({ $or: [{ email }, { usn }] });
    if (existingCandidate) {
      return res.status(400).json({ message: 'Candidate with this email or USN already exists' });
    }

    let photoUrl = null;
    if (req.files && req.files.photo) {
      // Upload file to Cloudinary
      const file = req.files.photo;
      const uploadRes = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'samca_candidates',
        resource_type: 'image',
      });
      photoUrl = uploadRes.secure_url;
    }

  const candidate = await Candidate.create({ name, usn: usnNorm, email, position, phone, photoUrl });
    res.json({ message: 'Candidate registered and pending approval', candidate });
  } catch (err) {
    console.error('Error registering candidate:', err.message);
    res.status(500).json({ message: 'Server error registering candidate' });
  }
};

exports.listPending = async (req, res) => {
  const candidates = await Candidate.find({ status: 'pending' });
  res.json({ candidates });
};

// List all candidates (admin view for registration management)
exports.listAll = async (req, res) => {
  const candidates = await Candidate.find();
  res.json({ candidates });
};

exports.approveCandidate = async (req, res) => {
  const { id } = req.params;
  const candidate = await Candidate.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
  res.json({ message: 'Candidate approved', candidate });
};

exports.rejectCandidate = async (req, res) => {
  const { id } = req.params;
  const candidate = await Candidate.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
  res.json({ message: 'Candidate rejected', candidate });
};

exports.deleteCandidate = async (req, res) => {
  const { id } = req.params;
  const candidate = await Candidate.findByIdAndDelete(id);
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
  res.json({ message: 'Candidate deleted' });
};
