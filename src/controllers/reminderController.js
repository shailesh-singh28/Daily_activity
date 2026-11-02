const Reminder = require('../models/Reminder');

const getReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    let reminders = await Reminder.find({ userId }).sort({ createdAt: 1 });

    if (reminders.length === 0) {
      const defaultReminders = [
        {
          userId,
          reminderId: 'water_reminder',
          title: 'Drink Water',
          emoji: '💧',
          soundType: 'drink',
          isEnabled: true,
          times: [
            { hour: 9, minute: 0, formatted: '9:00 AM' },
            { hour: 13, minute: 0, formatted: '1:00 PM' },
            { hour: 18, minute: 0, formatted: '6:00 PM' },
          ],
        },
        {
          userId,
          reminderId: 'reading_reminder',
          title: 'Reading Time',
          emoji: '📖',
          soundType: 'general',
          isEnabled: true,
          times: [{ hour: 20, minute: 30, formatted: '8:30 PM' }],
        },
        {
          userId,
          reminderId: 'stretch_reminder',
          title: 'Stretch & Walk',
          emoji: '🧘',
          soundType: 'general',
          isEnabled: true,
          times: [{ hour: 15, minute: 0, formatted: '3:00 PM' }],
        },
      ];
      reminders = await Reminder.insertMany(defaultReminders);
    }

    return res.json({
      success: true,
      count: reminders.length,
      reminders: reminders.map((r) => r.toJSON()),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving reminders', error: error.message });
  }
};

const saveReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, title, emoji = '🔔', times = [], is_enabled = true, sound_type } = req.body;

    if (!id || !title) {
      return res.status(400).json({ success: false, message: 'id and title are required' });
    }

    const sound = sound_type ||
      (title.toLowerCase().includes('water') || title.toLowerCase().includes('drink') || emoji === '💧'
        ? 'drink'
        : 'general');

    const formattedTimes = times.map((t) => {
      let formatted = t.formatted;
      if (!formatted) {
        const period = t.hour >= 12 ? 'PM' : 'AM';
        const displayH = t.hour % 12 === 0 ? 12 : t.hour % 12;
        const displayM = t.minute.toString().padStart(2, '0');
        formatted = `${displayH}:${displayM} ${period}`;
      }
      return {
        hour: t.hour,
        minute: t.minute,
        formatted,
      };
    });

    const reminder = await Reminder.findOneAndUpdate(
      { userId, reminderId: id },
      {
        $set: {
          title,
          emoji,
          times: formattedTimes,
          soundType: sound,
          isEnabled: is_enabled,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: 'Reminder saved successfully',
      reminder: reminder.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error saving reminder', error: error.message });
  }
};

const toggleReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { is_enabled } = req.body;

    const reminder = await Reminder.findOneAndUpdate(
      { userId, reminderId: id },
      { $set: { isEnabled: is_enabled } },
      { returnDocument: 'after' }
    );

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    return res.json({
      success: true,
      message: 'Reminder toggled successfully',
      reminder: reminder.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error toggling reminder', error: error.message });
  }
};

const deleteReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await Reminder.deleteOne({ userId, reminderId: id });

    return res.json({
      success: true,
      message: 'Reminder deleted successfully',
      id,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error deleting reminder', error: error.message });
  }
};

const syncReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reminders = [] } = req.body;

    for (const r of reminders) {
      if (!r.id || !r.title) continue;
      const sound = r.sound_type ||
        (r.title.toLowerCase().includes('water') || r.title.toLowerCase().includes('drink') || r.emoji === '💧'
          ? 'drink'
          : 'general');

      await Reminder.findOneAndUpdate(
        { userId, reminderId: r.id },
        {
          $set: {
            title: r.title,
            emoji: r.emoji || '🔔',
            times: (r.times || []).map((t) => ({
              hour: t.hour,
              minute: t.minute,
              formatted: t.formatted || `${t.hour}:${t.minute}`,
            })),
            soundType: sound,
            isEnabled: r.is_enabled !== undefined ? r.is_enabled : true,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }

    const all = await Reminder.find({ userId }).sort({ createdAt: 1 });

    return res.json({
      success: true,
      message: 'Reminders synchronized successfully',
      reminders: all.map((item) => item.toJSON()),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error syncing reminders', error: error.message });
  }
};

module.exports = {
  getReminders,
  saveReminder,
  toggleReminder,
  deleteReminder,
  syncReminders,
};
