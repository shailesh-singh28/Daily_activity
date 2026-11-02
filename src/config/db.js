const dns = require('dns');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Ensure SRV DNS lookup succeeds ONLY on Windows local machines
// Do NOT override DNS on Linux / cloud containers (Render, AWS, Docker)
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore if not permitted
  }
}

const DEFAULT_FALLBACK_URI =
  'mongodb+srv://shaileshsingh7617_db_user:mhHycRxffhJxJ6FG@cluster0.ebu7pmf.mongodb.net/daily_activity?retryWrites=true&w=majority';

let lastError = null;
let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  isConnecting = true;
  const uri = process.env.MONGODB_URI || DEFAULT_FALLBACK_URI;
  const dbName = process.env.DB_NAME || 'daily_activity';

  try {
    const conn = await mongoose.connect(uri, {
      dbName: dbName,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });
    lastError = null;
    console.log(`===============================================`);
    console.log(` MongoDB Connected Successfully!`);
    console.log(` Host:     ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);
    console.log(`===============================================`);
  } catch (error) {
    lastError = error.message;
    console.error('Failed to connect to MongoDB:', error.message);
  } finally {
    isConnecting = false;
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Retrying in 5 seconds...');
  setTimeout(() => connectDB(), 5000);
});

mongoose.connection.on('error', (err) => {
  lastError = err.message;
  console.error('MongoDB runtime error:', err.message);
});

const getDbStatus = () => {
  return {
    state: mongoose.connection.readyState,
    error: lastError,
  };
};

module.exports = { connectDB, getDbStatus };
