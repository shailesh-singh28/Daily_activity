const dns = require('dns');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Ensure SRV DNS lookup succeeds on Windows machines
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // If setServers fails in restricted environments, proceed with default
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'daily_activity';

  if (!uri) {
    console.error('ERROR: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: dbName,
    });
    console.log(`===============================================`);
    console.log(` MongoDB Connected Successfully!`);
    console.log(` Host:     ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);
    console.log(`===============================================`);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
