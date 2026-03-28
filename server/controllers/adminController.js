const { clerkClient } = require('@clerk/clerk-sdk-node');
const Team = require('../models/Team');

// Admin email whitelist from env (comma-separated)
const getAdminEmails = () =>
    (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);

// Middleware-style helper: fetch caller's email from Clerk and check whitelist
const requireAdmin = async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
        res.status(401).json({ message: 'Unauthorized.' });
        return false;
    }

    try {
        const user  = await clerkClient.users.getUser(userId);
        const email = user.emailAddresses?.[0]?.emailAddress ?? '';
        if (!getAdminEmails().includes(email)) {
            res.status(403).json({ message: 'Forbidden: Not an admin.' });
            return false;
        }
        return true;
    } catch (err) {
        console.error('[Admin] Clerk user lookup failed:', err.message);
        res.status(500).json({ message: 'Server error during admin auth.' });
        return false;
    }
};

// ─── GET /api/admin/teams ─────────────────────────────────────────────────────
const getAllTeams = async (req, res) => {
    if (!(await requireAdmin(req, res))) return;

    try {
        const teams = await Team.find({}).sort({ createdAt: -1 });
        res.status(200).json({ teams });
    } catch (error) {
        console.error('Error in getAllTeams:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─── PATCH /api/admin/teams/:id/round ─────────────────────────────────────────
const updateTeamRound = async (req, res) => {
    if (!(await requireAdmin(req, res))) return;

    try {
        const { id }    = req.params;
        const { round } = req.body;

        if (round === undefined || round < 0 || round > 3) {
            return res.status(400).json({ message: 'Round must be 0–3.' });
        }

        const team = await Team.findByIdAndUpdate(id, { currentRound: round }, { new: true });
        if (!team) return res.status(404).json({ message: 'Team not found.' });

        res.status(200).json({ message: 'Round updated.', team });
    } catch (error) {
        console.error('Error in updateTeamRound:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─── PATCH /api/admin/teams/:id/submission-status ────────────────────────────
const updateSubmissionStatus = async (req, res) => {
    if (!(await requireAdmin(req, res))) return;

    try {
        const { id }               = req.params;
        const { submissionStatus } = req.body;

        const valid = ['not_submitted', 'under_review', 'shortlisted'];
        if (!valid.includes(submissionStatus)) {
            return res.status(400).json({ message: 'Invalid status.' });
        }

        const team = await Team.findByIdAndUpdate(id, { submissionStatus }, { new: true });
        if (!team) return res.status(404).json({ message: 'Team not found.' });

        res.status(200).json({ message: 'Submission status updated.', team });
    } catch (error) {
        console.error('Error in updateSubmissionStatus:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─── PATCH /api/admin/teams/:id/venue ────────────────────────────────────────
const updateTeamVenue = async (req, res) => {
    if (!(await requireAdmin(req, res))) return;

    try {
        const { id }    = req.params;
        const { venue } = req.body;

        const team = await Team.findByIdAndUpdate(id, { venue: venue || '' }, { new: true });
        if (!team) return res.status(404).json({ message: 'Team not found.' });

        res.status(200).json({ message: 'Venue updated.', team });
    } catch (error) {
        console.error('Error in updateTeamVenue:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = {
    getAllTeams,
    updateTeamRound,
    updateSubmissionStatus,
    updateTeamVenue
};
