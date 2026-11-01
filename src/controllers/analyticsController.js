const DailySummary = require('../models/DailySummary');
const User = require('../models/User');

/**
 * Get the last 7 days history from MongoDB
 */
const getWeeklyHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch the user's recorded summaries, sorted ascending
    const records = await DailySummary.find({ userId })
      .sort({ date: -1 })
      .limit(7);

    // Return in chronological order
    const history = records.reverse().map((item) => item.toJSON());

    return res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving weekly history', error: error.message });
  }
};

/**
 * Get monthly history & actual aggregate metrics from MongoDB
 */
const getMonthlyHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const rows = await DailySummary.find({ userId })
      .sort({ date: -1 })
      .limit(30);

    const records = rows.reverse().map((r) => r.toJSON());
    const totalDays = records.length;
    const totalSteps = records.reduce((sum, r) => sum + r.total_steps, 0);
    const totalDistanceM = records.reduce((sum, r) => sum + r.total_distance_m, 0);
    const totalCalories = records.reduce((sum, r) => sum + r.total_calories, 0);
    const daysGoalAchieved = records.filter((r) => r.goal_achieved === true).length;

    const avgStepsPerDay = totalDays > 0 ? Math.round(totalSteps / totalDays) : 0;
    const avgCaloriesPerDay = totalDays > 0 ? Math.round(totalCalories / totalDays) : 0;

    return res.json({
      success: true,
      stats: {
        total_days_tracked: totalDays,
        total_steps: totalSteps,
        total_distance_km: parseFloat((totalDistanceM / 1000).toFixed(2)),
        total_calories: Math.round(totalCalories),
        avg_steps_per_day: avgStepsPerDay,
        avg_calories_per_day: avgCaloriesPerDay,
        days_goal_met: daysGoalAchieved,
      },
      records,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving monthly history', error: error.message });
  }
};

/**
 * Leaderboard / Community Ranking based on actual MongoDB users & steps
 */
const getLeaderboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Find all users
    const users = await User.find({}).select('name email _id');
    const summaries = await DailySummary.find({ date: today });

    const summaryMap = new Map();
    for (const s of summaries) {
      summaryMap.set(s.userId.toString(), s);
    }

    const leaderboard = users.map((u) => {
      const uId = u._id.toString();
      const s = summaryMap.get(uId);
      const steps = s ? s.totalSteps : 0;
      const distanceM = s ? s.totalDistanceM : 0;
      const calories = s ? s.totalCalories : 0;

      return {
        user_id: uId,
        name: u.name,
        steps,
        distance_km: parseFloat((distanceM / 1000).toFixed(2)),
        calories: Math.round(calories),
        is_current_user: uId === req.user.id,
      };
    });

    // Sort descending by steps
    leaderboard.sort((a, b) => b.steps - a.steps);

    // Assign rank
    leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return res.json({
      success: true,
      leaderboard: leaderboard.slice(0, 20),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving leaderboard', error: error.message });
  }
};

module.exports = {
  getWeeklyHistory,
  getMonthlyHistory,
  getLeaderboard,
};
