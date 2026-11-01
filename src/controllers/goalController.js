const Goal = require('../models/Goal');

const getGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    let goal = await Goal.findOne({ userId });

    if (!goal) {
      goal = await Goal.create({
        userId,
        dailySteps: 10000,
        dailyCalories: 500.0,
        dailyDistanceM: 7500.0,
        dailyActiveMinutes: 60,
      });
    }

    return res.json({ success: true, goals: goal.toJSON() });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving goals', error: error.message });
  }
};

const updateGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { daily_steps, daily_calories, daily_distance_m, daily_active_minutes } = req.body;

    let goal = await Goal.findOne({ userId });

    if (!goal) {
      goal = new Goal({ userId });
    }

    if (daily_steps !== undefined) goal.dailySteps = parseInt(daily_steps, 10);
    if (daily_calories !== undefined) goal.dailyCalories = parseFloat(daily_calories);
    if (daily_distance_m !== undefined) goal.dailyDistanceM = parseFloat(daily_distance_m);
    if (daily_active_minutes !== undefined) goal.dailyActiveMinutes = parseInt(daily_active_minutes, 10);

    await goal.save();

    return res.json({
      success: true,
      message: 'Goals updated successfully',
      goals: goal.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error updating goals', error: error.message });
  }
};

module.exports = {
  getGoals,
  updateGoals,
};
