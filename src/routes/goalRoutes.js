const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', goalController.getGoals);
router.put('/', goalController.updateGoals);

module.exports = router;
