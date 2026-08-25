/**
 * Shared Express app for local `node server.js` and Vercel serverless.
 */
const express = require('express');
const bodyParser = require('body-parser');

/**
 * Load routers with static require paths so Vercel NFT can trace deps
 * (bcryptjs, jsonwebtoken, etc.). Keep try/catch so one broken router
 * does not take down the whole API.
 */
function loadRouter(name, requireFn) {
  try {
    return requireFn();
  } catch (error) {
    console.error(`Failed to load ${name} router:`, error.message);
    const router = express.Router();
    router.use((req, res) => {
      res.status(500).json({
        success: false,
        error: `${name} module failed to load`,
        message: error.message,
        path: req.path,
      });
    });
    return router;
  }
}

function createApp({ serveStatic = false } = {}) {
  const app = express();
  const NODE_ENV = process.env.NODE_ENV || 'development';

  let db = null;
  try {
    db = require('../lib/db');
  } catch (error) {
    console.warn('Database module not available:', error.message);
  }

  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (NODE_ENV === 'production') {
      const allowedOrigins = [
        'https://unicabtraveltours.com',
        'https://www.unicabtraveltours.com',
        'https://unicabtravelandtours.com',
        'https://www.unicabtravelandtours.com',
      ];
      if (
        origin &&
        (allowedOrigins.includes(origin) ||
          /\.vercel\.app$/i.test(origin))
      ) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    } else {
      const devOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
      ];
      if (
        origin &&
        (devOrigins.includes(origin) ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1'))
      ) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  app.use(
    bodyParser.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON',
        message: 'Request body contains invalid JSON',
      });
    }
    next(error);
  });

  const authRouter = loadRouter('Auth', () => require('./routes/auth'));
  const toursRouter = loadRouter('Tours', () => require('./routes/tours'));
  const guidesRouter = loadRouter('Guides', () => require('./routes/guides'));
  const bookingsRouter = loadRouter('Bookings', () => require('./routes/bookings'));
  const paymentsRouter = loadRouter('Payments', () => require('./routes/payments'));
  const driverRouter = loadRouter('Driver', () => require('./routes/driver'));
  const adminRouter = loadRouter('Admin', () => require('./routes/admin'));
  const memberRouter = loadRouter('Member', () => require('./routes/member'));
  const packagesRouter = loadRouter('Packages', () => require('./routes/packages'));

  app.get('/api', (req, res) => {
    const dbStatus =
      db && db.isConfigured && db.isConfigured()
        ? { type: db.dbType, status: 'connected' }
        : { status: 'not configured' };

    res.json({
      message: 'UNICAB Travel & Tours API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        auth: { login: 'POST /api/auth/login', register: 'POST /api/auth/register' },
        tours: 'GET /api/tours',
        guides: 'GET /api/guides/available?date=YYYY-MM-DD',
        bookings: { create: 'POST /api/bookings' },
        payments: {
          status: 'GET /api/payments/status',
          createPayment: 'POST /api/payments/create-payment',
          confirm: 'POST /api/payments/confirm',
          webhook: 'POST /api/payments/webhook',
        },
        contact: 'POST /api/contact',
        packages: 'GET /api/packages',
        admin: { bookings: 'GET /api/admin/bookings' },
        driver: { bookings: 'GET /api/driver/bookings' },
        member: { bookings: 'GET /api/member/bookings' },
      },
      database: dbStatus,
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/tours', toursRouter);
  app.use('/api/guides', guidesRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/driver', driverRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/member', memberRouter);
  app.use('/api/packages', packagesRouter);

  app.post('/api/contact', async (req, res) => {
    const payload = req.body || {};
    const name = String(payload.name || '').trim();
    const email = String(payload.email || '').trim();
    const phone = String(payload.phone || '').trim();
    const message = String(payload.message || '').trim();

    if (name.length < 2) {
      return res.status(400).json({ ok: false, message: 'Please provide your full name.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, message: 'Please provide a valid email address.' });
    }
    if (phone.length < 7) {
      return res.status(400).json({ ok: false, message: 'Please provide a valid phone number.' });
    }
    if (message.length < 10) {
      return res.status(400).json({
        ok: false,
        message: 'Please provide a message (at least 10 characters).',
      });
    }

    try {
      const { createLead } = require('../lib/leads');
      await createLead({
        source: payload.package_id ? 'package' : 'contact',
        name,
        email,
        phone,
        message,
        package_id: payload.package_id || null,
      });
      const { sendContactEmail } = require('../lib/sendContactEmail');
      await sendContactEmail({ name, email, phone, message });
      return res.json({
        ok: true,
        message:
          'Thank you. Your request has been received. Our team will respond with a detailed proposal shortly.',
      });
    } catch (err) {
      console.error('Contact email error:', err);
      if (err.code === 'CONFIG') {
        return res.status(503).json({
          ok: false,
          message:
            'Contact email is not configured yet. Please email info@unicabtravel.co.za directly.',
        });
      }
      return res.status(502).json({
        ok: false,
        message: err.message || 'Failed to send email. Please try again.',
      });
    }
  });

  app.post('/api/review', (req, res) => {
    const payload = req.body || {};
    console.log('New review submission:', payload);
    return res.json({ ok: true, message: 'Review submitted successfully' });
  });

  if (serveStatic) {
    const path = require('path');
    const distPath = path.join(__dirname, '..', 'dist');
    const serveDist = express.static(distPath, {
      maxAge: NODE_ENV === 'production' ? '1y' : '0',
      etag: true,
    });
    app.use(serveDist);
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      return res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
          res
            .status(200)
            .send(
              'Build not found. Run `npm run dev` for the Vite dev server or `npm run build` then `node server.js`.'
            );
        }
      });
    });
  }

  app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
        details: NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  });

  return app;
}

module.exports = { createApp };
