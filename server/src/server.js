const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`SafeComute API on :${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });
