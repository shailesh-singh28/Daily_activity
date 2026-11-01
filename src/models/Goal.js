const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    dailySteps: {
      type: Number,
      default: 10000,
    },
    dailyCalories: {
      type: Number,
      default: 500.0,
    },
    dailyDistanceM: {
      type: Number,
      default: 7500.0,
    },
    dailyActiveMinutes: {
      type: Number,
      default: 60,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.daily_steps = ret.dailySteps;
        ret.daily_calories = ret.dailyCalories;
        ret.daily_distance_m = ret.dailyDistanceM;
        ret.daily_active_minutes = ret.dailyActiveMinutes;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Goal', goalSchema);
