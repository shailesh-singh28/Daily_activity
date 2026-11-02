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

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || DEFAULT_FALLBACK_URI;
  const dbName = process.env.DB_NAME || 'daily_activity';

  try {
    const conn = await mongoose.connect(uri, {
      dbName: dbName,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
    });
    console.log(`===============================================`);
    console.log(` MongoDB Connected Successfully!`);
    console.log(` Host:     ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);
    console.log(`===============================================`);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
  }
};

module.exports = { connectDB };
