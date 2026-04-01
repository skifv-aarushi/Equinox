/**
 * Equinox — Express Server entry point
 */

require('dotenv').config();

const connectDB = require('./config/db');
const app       = require('./app');

const PORT = process.env.PORT || 5000;
connectDB();
app.listen(PORT, () => console.log(`☉ Equinox server listening on port ${PORT}`));
