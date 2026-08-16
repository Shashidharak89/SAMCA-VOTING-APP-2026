const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
	const header = req.headers.authorization;
	if (!header) return res.status(401).json({ message: 'Missing token' });
	const token = header.replace('Bearer ', '');
	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
		req.user = payload;
		next();
	} catch (e) {
		return res.status(401).json({ message: 'Invalid token' });
	}
}

router.get('/positions-candidates', voteController.getPositionsAndCandidates);
router.post('/submit', auth, voteController.submitVote);

module.exports = router;
