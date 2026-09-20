require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/safecomute',
  OPENWEATHER_KEY: process.env.OPENWEATHER_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
};
