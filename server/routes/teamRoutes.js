const express = require('express');
const router  = express.Router();
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const {
    createTeam,
    joinTeam,
    getTeamByUserEmail,
    submitGdriveLink,
    getInventory,
    claimComponent,
    unclaimComponent
} = require('../controllers/teamControllers');

router.post('/create',           ClerkExpressRequireAuth(), createTeam);
router.post('/join',             ClerkExpressRequireAuth(), joinTeam);
router.get('/user/:email',       ClerkExpressRequireAuth(), getTeamByUserEmail);
router.post('/submit-link',      ClerkExpressRequireAuth(), submitGdriveLink);
router.get('/inventory',         ClerkExpressRequireAuth(), getInventory);
router.post('/claim-component',  ClerkExpressRequireAuth(), claimComponent);
router.delete('/claim-component', ClerkExpressRequireAuth(), unclaimComponent);

module.exports = router;
