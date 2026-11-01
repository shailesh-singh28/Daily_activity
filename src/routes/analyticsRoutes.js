const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/weekly', analyticsController.getWeeklyHistory);
router.get('/monthly', analyticsController.getMonthlyHistory);
router.get('/leaderboard', analyticsController.getLeaderboard);

module.exports = router;
