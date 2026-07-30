/**
 * Vercel serverless catch-all for Express API routes.
 * Requests to /api/* are handled by the shared Express app.
 *
 * Explicit requires so Vercel NFT includes these packages (routers are
 * loaded via createApp and were being omitted from the serverless bundle).
 */
require('bcryptjs');
require('jsonwebtoken');

const { createApp } = require('../server/createApp');

const app = createApp({ serveStatic: false });

module.exports = app;
