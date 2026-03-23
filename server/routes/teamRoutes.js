const express = require('express');
const router = express.Router();
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const {
    createTeam,
    joinTeam,
    getTeamByUserEmail
} = require('../controllers/registerController');

// All routes here will require a valid Clerk JWT token sent from the frontend
router.post('/create', ClerkExpressRequireAuth(), createTeam);
router.post('/join', ClerkExpressRequireAuth(), joinTeam);
router.get('/user/:email', ClerkExpressRequireAuth(), getTeamByUserEmail);

module.exports = router;