/**
 * Vercel serverless catch-all for Express API routes.
 * Requests to /api/* are handled by the shared Express app.
 */
const { createApp } = require('../server/createApp');

const app = createApp({ serveStatic: false });

module.exports = app;
