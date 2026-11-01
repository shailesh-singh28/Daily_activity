const express = require('express');
const router = express.Router();
const stepController = require('../controllers/stepController');
const authMiddleware = require('../middleware/auth');

// All step routes are protected
router.use(authMiddleware);

router.post('/sync', stepController.syncSteps);
router.get('/today', stepController.getTodaySteps);
router.post('/workout', stepController.logWorkoutSession);

module.exports = router;
