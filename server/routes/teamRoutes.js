const express = require('express');
const router  = express.Router();
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const {
    createTeam,
    joinTeam,
    getTeamByUserEmail,
    submitGdriveLink,
    updateVtopStatus,
    leaveTeam
} = require('../controllers/teamControllers');

router.post('/create',      ClerkExpressRequireAuth(), createTeam);
router.post('/join',        ClerkExpressRequireAuth(), joinTeam);
router.get('/user/:email',  ClerkExpressRequireAuth(), getTeamByUserEmail);
router.post('/submit-link', ClerkExpressRequireAuth(), submitGdriveLink);
router.patch('/vtop',       ClerkExpressRequireAuth(), updateVtopStatus);
router.delete('/leave',     ClerkExpressRequireAuth(), leaveTeam);

module.exports = router;
