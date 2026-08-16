const express = require('express');
const router = express.Router();
const positionController = require('../controllers/positionController');
const adminModule = require('./admin');
const adminAuth = adminModule.adminAuth;

// Public routes
router.get('/', positionController.getPositions);
router.get('/analytics', positionController.getVotingAnalytics);
router.get('/analytics/:positionName', positionController.getPositionAnalytics);

// Admin routes
router.post('/', adminAuth, positionController.addPosition);
router.put('/:id', adminAuth, positionController.updatePosition);
router.delete('/:id', adminAuth, positionController.deletePosition);

module.exports = router;
