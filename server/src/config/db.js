const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const connectDB = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');
};

module.exports = connectDB;
