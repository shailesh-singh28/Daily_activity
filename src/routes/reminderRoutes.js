const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', reminderController.getReminders);
router.post('/', reminderController.saveReminder);
router.post('/sync', reminderController.syncReminders);
router.patch('/:id/toggle', reminderController.toggleReminder);
router.delete('/:id', reminderController.deleteReminder);

module.exports = router;
