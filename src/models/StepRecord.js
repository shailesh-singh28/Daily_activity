const mongoose = require('mongoose');

const stepRecordSchema = new mongoose.Schema(
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
    timestamp: {
      type: Date,
      default: Date.now,
    },
    stepCount: {
      type: Number,
      required: true,
    },
    distanceMeters: {
      type: Number,
      default: 0,
    },
    calories: {
      type: Number,
      default: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      default: 'pedometer',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.step_count = ret.stepCount;
        ret.distance_meters = ret.distanceMeters;
        ret.duration_seconds = ret.durationSeconds;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('StepRecord', stepRecordSchema);
