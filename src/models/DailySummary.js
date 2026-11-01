const mongoose = require('mongoose');

const dailySummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    totalSteps: {
      type: Number,
      default: 0,
    },
    totalDistanceM: {
      type: Number,
      default: 0,
    },
    totalCalories: {
      type: Number,
      default: 0,
    },
    activeMinutes: {
      type: Number,
      default: 0,
    },
    goalSteps: {
      type: Number,
      default: 10000,
    },
    goalAchieved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.total_steps = ret.totalSteps;
        ret.total_distance_m = ret.totalDistanceM;
        ret.total_distance_km = parseFloat((ret.totalDistanceM / 1000).toFixed(2));
        ret.total_calories = ret.totalCalories;
        ret.active_minutes = ret.activeMinutes;
        ret.goal_steps = ret.goalSteps;
        ret.goal_achieved = ret.goalAchieved;
        ret.progress_percentage = ret.goalSteps > 0
          ? Math.min(100, Math.round((ret.totalSteps / ret.goalSteps) * 100))
          : 100;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index so each user has at most 1 summary per date
dailySummarySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailySummary', dailySummarySchema);
