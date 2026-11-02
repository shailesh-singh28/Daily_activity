const User = require('../models/User');
const Goal = require('../models/Goal');
const StepRecord = require('../models/StepRecord');
const DailySummary = require('../models/DailySummary');
const {
  calculateDistanceMeters,
  calculateCalories,
  calculateActiveMinutes,
} = require('../utils/calculations');

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Sync steps from Flutter app to MongoDB
 */
const syncSteps = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      date = getTodayDateString(),
      steps,
      distance_m,
      calories,
      duration_seconds = 0,
      timestamp = new Date(),
      source = 'pedometer',
    } = req.body;

    if (steps === undefined || steps === null || steps < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid step count is required (must be >= 0)',
      });
    }

    // Get user body specs from MongoDB
    const user = await User.findById(userId);
    const strideLength = user ? user.stride_length_cm : 74;
    const weight = user ? user.weight_kg : 70;

    // Computed values
    const finalDistance =
      distance_m !== undefined ? parseFloat(distance_m) : calculateDistanceMeters(steps, strideLength);
    const finalCalories =
      calories !== undefined ? parseFloat(calories) : calculateCalories(steps, weight, strideLength);
    const finalActiveMinutes = calculateActiveMinutes(steps);

    // 1. Upsert single record per day per user into StepRecord collection
    await StepRecord.findOneAndUpdate(
      { userId, date },
      {
        $max: {
          stepCount: steps,
          distanceMeters: finalDistance,
          calories: finalCalories,
          durationSeconds: duration_seconds,
        },
        $set: {
          timestamp: new Date(timestamp),
          source,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // 2. Fetch or create user's goal
    let goal = await Goal.findOne({ userId });
    const targetGoal = goal ? goal.dailySteps : 10000;

    // 3. Upsert daily summary in MongoDB
    let summary = await DailySummary.findOne({ userId, date });

    let newTotalSteps = steps;
    let newTotalDistance = finalDistance;
    let newTotalCalories = finalCalories;
    let newActiveMinutes = finalActiveMinutes;

    if (summary) {
      newTotalSteps = Math.max(summary.totalSteps, steps);
      newTotalDistance = Math.max(summary.totalDistanceM, finalDistance);
      newTotalCalories = Math.max(summary.totalCalories, finalCalories);
      newActiveMinutes = Math.max(summary.activeMinutes, finalActiveMinutes);

      summary.totalSteps = newTotalSteps;
      summary.totalDistanceM = newTotalDistance;
      summary.totalCalories = newTotalCalories;
      summary.activeMinutes = newActiveMinutes;
      summary.goalSteps = targetGoal;
      summary.goalAchieved = newTotalSteps >= targetGoal;
      await summary.save();
    } else {
      summary = await DailySummary.create({
        userId,
        date,
        totalSteps: newTotalSteps,
        totalDistanceM: newTotalDistance,
        totalCalories: newTotalCalories,
        activeMinutes: newActiveMinutes,
        goalSteps: targetGoal,
        goalAchieved: newTotalSteps >= targetGoal,
      });
    }

    return res.json({
      success: true,
      message: 'Step activity synced successfully',
      summary: summary.toJSON(),
    });
  } catch (error) {
    console.error('syncSteps error:', error);
    return res.status(500).json({ success: false, message: 'Server error syncing steps', error: error.message });
  }
};

/**
 * Get Today's Step Summary and Goal Progress from MongoDB
 */
const getTodaySteps = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayDateString();

    const goal = await Goal.findOne({ userId });
    const targetSteps = goal ? goal.dailySteps : 10000;
    const targetCalories = goal ? goal.dailyCalories : 500;
    const targetDistance = goal ? goal.dailyDistanceM : 7500;

    let summary = await DailySummary.findOne({ userId, date: today });

    if (!summary) {
      summary = {
        date: today,
        total_steps: 0,
        total_distance_m: 0,
        total_distance_km: 0.0,
        total_calories: 0,
        active_minutes: 0,
        goal_steps: targetSteps,
        goal_achieved: false,
        progress_percentage: 0,
      };
    } else {
      summary = summary.toJSON();
    }

    const recentLogs = await StepRecord.find({ userId, date: today })
      .sort({ timestamp: -1 })
      .limit(10);

    return res.json({
      success: true,
      data: {
        ...summary,
        goal_steps: targetSteps,
        goal_calories: targetCalories,
        goal_distance_m: targetDistance,
        recent_logs: recentLogs.map((log) => log.toJSON()),
      },
    });
  } catch (error) {
    console.error('getTodaySteps error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving today steps', error: error.message });
  }
};

/**
 * Log a dedicated workout session to MongoDB
 */
const logWorkoutSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { activity_type = 'Walk', steps, duration_seconds = 0 } = req.body;

    if (!steps || steps < 0) {
      return res.status(400).json({ success: false, message: 'Valid step count is required' });
    }

    const today = getTodayDateString();
    const user = await User.findById(userId);
    const strideLength = user ? user.stride_length_cm : 74;
    const weight = user ? user.weight_kg : 70;

    const distanceM = calculateDistanceMeters(steps, strideLength);
    const calories = calculateCalories(steps, weight, strideLength);

    // Maintain single record per day per user by incrementing today's totals
    await StepRecord.findOneAndUpdate(
      { userId, date: today },
      {
        $inc: {
          stepCount: steps,
          distanceMeters: distanceM,
          calories: calories,
          durationSeconds: duration_seconds,
        },
        $set: {
          timestamp: new Date(),
          source: `workout:${activity_type}`,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    const goal = await Goal.findOne({ userId });
    const targetGoal = goal ? goal.dailySteps : 10000;

    let summary = await DailySummary.findOne({ userId, date: today });
    if (summary) {
      summary.totalSteps += steps;
      summary.totalDistanceM += distanceM;
      summary.totalCalories += calories;
      summary.activeMinutes += Math.round(duration_seconds / 60);
      summary.goalAchieved = summary.totalSteps >= targetGoal;
      await summary.save();
    } else {
      summary = await DailySummary.create({
        userId,
        date: today,
        totalSteps: steps,
        totalDistanceM: distanceM,
        totalCalories: calories,
        activeMinutes: Math.round(duration_seconds / 60),
        goalSteps: targetGoal,
        goalAchieved: steps >= targetGoal,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Workout session logged successfully',
      data: {
        activity_type,
        steps,
        distance_m: distanceM,
        distance_km: parseFloat((distanceM / 1000).toFixed(2)),
        calories,
        duration_seconds,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error logging workout', error: error.message });
  }
};

module.exports = {
  syncSteps,
  getTodaySteps,
  logWorkoutSession,
};
