// Load environment variables from .env file
require('dotenv').config();

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Check database connection status
let db;
try {
  db = require('./lib/db');
  if (db.isConfigured && db.isConfigured()) {
    console.log(`✅ Database: ${db.dbType === 'supabase' ? 'Using Supabase (service role)' : db.dbType === 'postgres' ? 'Using PostgreSQL (direct connection)' : 'Not configured'}`);
  } else {
    console.warn('⚠️  Database: Not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
  }
} catch (error) {
  console.warn('⚠️  Database module not available:', error.message);
  db = null;
}

const distPath = path.join(__dirname, "dist");
const serveDist = express.static(distPath, {
  maxAge: NODE_ENV === "production" ? "1y" : "0",
  etag: true
});

// CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (NODE_ENV === "production") {
    const allowedOrigins = [
      "https://unicabtraveltours.com",
      "https://www.unicabtraveltours.com",
      "https://unicabtravelandtours.com",
      "https://www.unicabtravelandtours.com",
    ];
    if (origin && (allowedOrigins.includes(origin) || origin.endsWith(".up.railway.app"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
  } else {
    // Development: Allow localhost and common dev ports
    const devOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000"
    ];
    if (origin && (devOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
  }
  
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(bodyParser.json({ limit: "1mb" }));

// Global error handler for JSON parsing errors
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    });
  }
  next(error);
});

// API Routes - with error handling
let authRouter, toursRouter, guidesRouter, bookingsRouter, paymentsRouter;
let driverRouter, adminRouter, memberRouter;

try {
  authRouter = require('./api/auth');
} catch (error) {
  console.error('Failed to load auth router:', error);
  // Create a fallback router that returns errors
  authRouter = express.Router();
  authRouter.use((req, res) => {
    res.status(500).json({
      success: false,
      error: 'Auth module failed to load',
      message: error.message
    });
  });
}

// Load API routers with individual error handling
const loadRouter = (path, name) => {
  try {
    return require(path);
  } catch (error) {
    console.error(`⚠️  Failed to load ${name} router:`, error.message);
    // Return a fallback router that returns helpful errors
    const router = express.Router();
    router.use((req, res) => {
      res.status(500).json({
        success: false,
        error: `${name} module failed to load`,
        message: error.message,
        path: req.path
      });
    });
    return router;
  }
};

toursRouter = loadRouter('./api/tours', 'Tours');
guidesRouter = loadRouter('./api/guides', 'Guides');
bookingsRouter = loadRouter('./api/bookings', 'Bookings');
paymentsRouter = loadRouter('./api/payments', 'Payments');
driverRouter = loadRouter('./api/driver', 'Driver');
adminRouter = loadRouter('./api/admin', 'Admin');
memberRouter = loadRouter('./api/member', 'Member');

// API info endpoint (helpful for testing)
app.get('/api', (req, res) => {
  const dbStatus = db && db.isConfigured && db.isConfigured() ? {
    type: db.dbType,
    status: 'connected'
  } : {
    status: 'not configured'
  };

  res.json({
    message: 'UNICAB Travel & Tours API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register'
      },
      tours: 'GET /api/tours',
      guides: 'GET /api/guides/available?date=YYYY-MM-DD',
      bookings: {
        list: 'GET /api/bookings',
        create: 'POST /api/bookings'
      },
      payments: {
        status: 'GET /api/payments/status',
        createPayment: 'POST /api/payments/create-payment',
        confirm: 'POST /api/payments/confirm',
        webhook: 'POST /api/payments/webhook'
      },
      admin: {
        bookings: 'GET /api/admin/bookings',
        drivers: 'GET /api/admin/drivers'
      },
      driver: {
        bookings: 'GET /api/driver/bookings',
        unavailability: 'GET /api/driver/unavailability'
      },
      member: {
        bookings: 'GET /api/member/bookings'
      }
    },
    database: dbStatus
  });
});

// Public routes
app.use('/api/auth', authRouter);
app.use('/api/tours', toursRouter);
app.use('/api/guides', guidesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/payments', paymentsRouter);

// Protected routes (require authentication)
app.use('/api/driver', driverRouter);
app.use('/api/admin', adminRouter);
app.use('/api/member', memberRouter);

// Contact API endpoint
app.post("/api/contact", (req, res) => {
  const payload = req.body || {};
  console.log("New contact enquiry:", payload);
  // TODO: Add email service integration here (e.g., SendGrid, Nodemailer, etc.)
  return res.json({
    ok: true,
    message:
      "Thank you. Your request has been received. Our team will respond with a detailed proposal shortly."
  });
});

// Review API endpoint
app.post("/api/review", (req, res) => {
  const payload = req.body || {};
  console.log("New review submission:", payload);
  
  // Format email content
  const emailSubject = `New ${payload.type === 'driver' ? 'Driver' : 'Tour'} Review - ${payload.targetName}`;
  const emailBody = `
New Review Submission

Review Type: ${payload.type === 'driver' ? 'Driver Review' : 'Tour Review'}
${payload.type === 'driver' ? 'Driver' : 'Tour'}: ${payload.targetName}
Reviewer Name: ${payload.name}
Rating: ${payload.rating}/5
Review Text:
${payload.text}

Submitted: ${new Date(payload.date).toLocaleString()}

---
This is an automated notification from UNICAB Travel & Tours website.
  `.trim();

  // TODO: Add email service integration here (e.g., SendGrid, Nodemailer, etc.)
  // Example:
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransport({...});
  // await transporter.sendMail({
  //   from: 'noreply@unicabtraveltours.com',
  //   to: 'info@unicabtravel.co.za',
  //   subject: emailSubject,
  //   text: emailBody
  // });

  // For now, log the email content (in production, this would send the email)
  console.log("Email would be sent to: info@unicabtravel.co.za");
  console.log("Subject:", emailSubject);
  console.log("Body:", emailBody);

  return res.json({
    ok: true,
    message: "Review submitted successfully"
  });
});

// Serve built assets if they exist; otherwise advise to run npm run dev
app.use(serveDist);

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  // SPA fallback to index in dist if present
  return res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      res
        .status(200)
        .send(
          "Build not found. Run `npm run dev` for the Vite dev server or `npm run build` then `node server.js` to serve the built app."
        );
    }
  });
});

// Global error handler for unhandled errors
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      details: NODE_ENV === "development" ? error.stack : undefined
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 UNICAB Travel & Tours server running on port ${PORT}`);
  console.log(`📦 Environment: ${NODE_ENV}`);
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
    console.log(`💳 YOCO payments: ${mode}`);
  } else {
    console.warn('⚠️  YOCO_SECRET_KEY not set — checkout payments will fail');
  }
  if (NODE_ENV === "production") {
    console.log(`📁 Serving static files from: ${distPath}`);
  } else {
    console.log(`💻 Development mode - API available at http://localhost:${PORT}/api`);
    console.log(`📝 Frontend should run on separate port (typically 5173)`);
  }
  console.log(`\n✅ Server ready!\n`);
});

