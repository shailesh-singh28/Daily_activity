const mongoose = require('mongoose');

const reminderTimeSchema = new mongoose.Schema(
  {
    hour: { type: Number, required: true },
    minute: { type: Number, required: true },
    formatted: { type: String, required: true },
  },
  { _id: false }
);

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reminderId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    emoji: {
      type: String,
      default: '🔔',
    },
    times: [reminderTimeSchema],
    soundType: {
      type: String,
      default: 'general',
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret.reminderId || ret._id.toString();
        ret.times = ret.times || [];
        ret.sound_type = ret.soundType;
        ret.is_enabled = ret.isEnabled;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index per user and reminderId
reminderSchema.index({ userId: 1, reminderId: 1 }, { unique: true });

module.exports = mongoose.model('Reminder', reminderSchema);
