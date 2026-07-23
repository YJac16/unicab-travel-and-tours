require('dotenv').config();

const { createApp } = require('./server/createApp');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = createApp({ serveStatic: true });

app.listen(PORT, () => {
  console.log(`\nUNICAB Travel & Tours server running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  const yocoKey =
    process.env.YOCO_SECRET_KEY ||
    process.env.YOCO_LIVE_SECRET_KEY ||
    process.env.YOCO_SECRET ||
    process.env.YOCO_LIVE_KEY;
  if (yocoKey) {
    const mode = String(yocoKey).startsWith('sk_live_')
      ? 'live'
      : String(yocoKey).startsWith('sk_test_')
        ? 'test'
        : 'configured';
    console.log(`YOCO payments: ${mode}`);
  } else {
    console.warn('YOCO_SECRET_KEY not set — checkout payments will fail');
  }
  if (NODE_ENV === 'production') {
    console.log('Serving static files from dist/');
  } else {
    console.log(`API available at http://localhost:${PORT}/api`);
  }
  console.log('Server ready!\n');
});
