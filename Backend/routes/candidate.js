const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const adminController = require('../controllers/adminController');
const { adminAuth } = require('./admin'); // now a no-op
// Cloudinary handles image upload, no multer needed
router.post('/register', candidateController.registerCandidate);
router.get('/pending', adminAuth, candidateController.listPending);
router.get('/all', adminAuth, candidateController.listAll);
router.post('/:id/approve', adminAuth, candidateController.approveCandidate);
router.post('/:id/reject', adminAuth, candidateController.rejectCandidate);
router.delete('/:id', adminAuth, candidateController.deleteCandidate);

module.exports = router;
