const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid format (Bearer token required)',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'daily_activity_super_secure_jwt_secret_key_2026';

    const decoded = jwt.verify(token, secret);
    req.user = decoded; // { id, email, name }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired token',
      error: err.message,
    });
  }
};

module.exports = authMiddleware;
