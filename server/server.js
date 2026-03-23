/**
 * Equinox — Express Server
 * Handles registration API
 */

// 1. LOAD ENV VARIABLES FIRST
// Do this before any other imports so they have access to process.env immediately
require('dotenv').config();

// 2. IMPORTS
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db'); // Pulls in your DB connection file
const teamRoutes = require('./routes/teamRoutes');

// 3. INITIALIZE EXPRESS & DB
const app = express();
const PORT = process.env.PORT || 5000;
connectDB(); // Actually fires the connection to MongoDB Atlas

// 4. GLOBAL MIDDLEWARE
app.use(cors());
app.use(express.json());

// 5. API ROUTES
// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Equinox server running' });
});

app.use('/api/teams', teamRoutes);

// 6. CLERK GLOBAL ERROR HANDLER
// Catches unauthorized requests to protected routes
app.use((err, req, res, next) => {
    if (err.message === 'Unauthenticated') {
        return res.status(401).json({ error: 'Unauthenticated. Please sign in.' });
    }
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// 7. SERVE STATIC FILES (React Frontend)
const staticDir = path.join(__dirname, '../client/dist');
app.use(express.static(staticDir));

// Catch-all to return the client index for any other request (for SPA routing)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
});

// 8. START SERVER
app.listen(PORT, () => {
    console.log(`☉ Equinox server listening on port ${PORT}`);
});