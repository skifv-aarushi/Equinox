const express = require('express');
const router  = express.Router();
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const {
    getAllTeams,
    updateTeamRound,
    updateSubmissionStatus,
    updateTeamVenue
} = require('../controllers/adminController');

// All admin routes require a valid Clerk JWT; additional admin-email check is
// done inside each controller via requireAdmin().
router.get('/teams',                    ClerkExpressRequireAuth(), getAllTeams);
router.patch('/teams/:id/round',        ClerkExpressRequireAuth(), updateTeamRound);
router.patch('/teams/:id/submission-status', ClerkExpressRequireAuth(), updateSubmissionStatus);
router.patch('/teams/:id/venue',        ClerkExpressRequireAuth(), updateTeamVenue);

module.exports = router;
