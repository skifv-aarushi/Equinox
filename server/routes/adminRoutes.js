const express = require('express');
const router  = express.Router();
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const {
    getAllTeams,
    setVerdict,
    advanceRound,
    bulkUpdateTeams,
    getSettings,
    updateTeamVenue,
    executeQuery,
    listCollections
} = require('../controllers/adminController');

const auth = ClerkExpressRequireAuth();

// Teams
router.get('/teams',                      auth, getAllTeams);
router.put('/verdict',                    auth, setVerdict);
router.patch('/teams/:id/venue',          auth, updateTeamVenue);
router.post('/teams/bulk-update',         auth, bulkUpdateTeams);

// Round advancement
router.post('/advance-round',             auth, advanceRound);

// Settings
router.get('/settings',                   auth, getSettings);

// Query console
router.post('/query',                     auth, executeQuery);
router.get('/collections',                auth, listCollections);

module.exports = router;
