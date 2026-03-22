/**
 * Equinox — Express Server
 * Handles registration API
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch((error) => console.error('Database connection failed:', error));

const express = require('express');
const cors = require('cors');
const registerRoutes = require('./routes/register');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', registerRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Equinox server running' });
});

// Serve static client files from the build directory
const path = require('path');
const staticDir = path.join(__dirname, '../client/dist');
app.use(express.static(staticDir));

// Catch-all to return the client index for any other request (for SPA routing)
// Use a regex route instead of string pattern to avoid parsing issues with '*' in Express 5
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`☉ Equinox server listening on port ${PORT}`);
});
