const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Goal = require('../models/Goal');

const JWT_SECRET = process.env.JWT_SECRET || 'daily_activity_super_secure_jwt_secret_key_2026';

const register = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is connecting. Please ensure 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access and try again.',
      });
    }

    const { name, email, password, weight_kg, height_cm, stride_length_cm } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists in MongoDB
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const weight = weight_kg ? parseFloat(weight_kg) : 70.0;
    const height = height_cm ? parseFloat(height_cm) : 170.0;
    const stride = stride_length_cm ? parseFloat(stride_length_cm) : Math.round(height * 0.43);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      weight_kg: weight,
      height_cm: height,
      stride_length_cm: stride,
    });

    // Create default goals for this user in MongoDB
    await Goal.create({
      userId: user._id,
      dailySteps: 10000,
      dailyCalories: 500.0,
      dailyDistanceM: 7500.0,
      dailyActiveMinutes: 60,
    });

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is connecting. Please ensure 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access and try again.',
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, user: user.toJSON() });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, weight_kg, height_cm, stride_length_cm, avatar_url } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name !== undefined) user.name = name.trim();
    if (avatar_url !== undefined) user.avatar_url = avatar_url;
    if (weight_kg !== undefined) user.weight_kg = parseFloat(weight_kg);
    if (height_cm !== undefined) user.height_cm = parseFloat(height_cm);
    if (stride_length_cm !== undefined) {
      user.stride_length_cm = parseFloat(stride_length_cm);
    } else if (height_cm !== undefined) {
      user.stride_length_cm = Math.round(user.height_cm * 0.43);
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};
