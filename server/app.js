'use strict';
/**
 * app.js — Express app factory (no DB connect, no listen)
 * Imported by server.js (production) and tests alike.
 */

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const teamRoutes  = require('./routes/teamRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// ── API routes ──
app.get('/api/health', (_req, res) =>
    res.json({ status: 'ok', message: 'Equinox server running' })
);
app.use('/api/teams', teamRoutes);
app.use('/api/admin', adminRoutes);

// ── Global error handler (Clerk 401s) ──
app.use((err, _req, res, _next) => {
    if (err.message === 'Unauthenticated') {
        return res.status(401).json({ error: 'Unauthenticated. Please sign in.' });
    }
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// ── Serve React frontend (SPA fallback) ──
const staticDir = path.join(__dirname, '../client');
app.use(express.static(staticDir));
app.get(/.*/, (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));

module.exports = app;
