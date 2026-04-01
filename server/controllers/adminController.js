const { clerkClient } = require('@clerk/clerk-sdk-node');
const mongoose = require('mongoose');
const Team     = require('../models/Team');
const Settings = require('../models/Settings');

// Admin email whitelist from env (comma-separated)
const getAdminEmails = () =>
    (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);

// Verify caller is an admin via Clerk JWT + email whitelist
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

// ─── PUT /api/admin/verdict ──────────────────────────────────────────────────
// Sets the status of a team for their current round inside roundSubmissions[].
// Body: { teamId, submissionStatus }
//  - rejected  → team's currentRound locks (they never advance)
//  - shortlisted → team stays at their current round until global round advances
const setVerdict = async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
        const { teamId, submissionStatus } = req.body;
        const valid = ['not_submitted', 'under_review', 'rejected', 'shortlisted'];
        if (!valid.includes(submissionStatus))
            return res.status(400).json({ message: 'Invalid status.' });

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: 'Team not found.' });

        const round = team.currentRound ?? 0;

        // Find or create the roundSubmissions entry for the current round
        let entry = team.roundSubmissions.find(s => s.round === round);
        if (!entry) {
            team.roundSubmissions.push({
                round,
                gdriveLink: team.gdriveLink || '',
                submissionStatus
            });
        } else {
            entry.submissionStatus = submissionStatus;
        }

        // Mirror to flat fields for backward compatibility
        team.submissionStatus = submissionStatus;

        await team.save();
        res.status(200).json({ message: 'Verdict updated.', team });
    } catch (error) {
        console.error('Error in setVerdict:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─── POST /api/admin/advance-round ───────────────────────────────────────────
// Advances the global round. For shortlisted teams in the old round:
//   1) Increment their currentRound
//   2) Push a new roundSubmissions entry with under_review + carry over gdriveLink
// Rejected / not_submitted teams stay frozen at their old round.
const advanceRound = async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
        const { round } = req.body;
        if (typeof round !== 'number' || round < 0 || round > 3)
            return res.status(400).json({ message: 'Round must be 0–3.' });

        // Read previous global round
        const prev = await Settings.findOne({ key: 'globalRound' });
        const prevRound = prev?.value ?? 0;

        // Persist the new global round
        await Settings.findOneAndUpdate(
            { key: 'globalRound' },
            { value: round },
            { upsert: true, new: true }
        );

        // Only promote when ADVANCING (not when going back)
        if (round > prevRound) {
            // Find teams that were shortlisted in the previous round
            const shortlisted = await Team.find({
                currentRound: prevRound,
                submissionStatus: 'shortlisted'
            });

            for (const team of shortlisted) {
                // Carry over the GDrive link from the previous round
                const prevEntry = team.roundSubmissions.find(s => s.round === prevRound);
                const carryLink = prevEntry?.gdriveLink || team.gdriveLink || '';

                // Push new round entry
                team.roundSubmissions.push({
                    round,
                    gdriveLink: carryLink,
                    submissionStatus: 'under_review'
                });

                // Update flat fields
                team.currentRound     = round;
                team.submissionStatus = 'under_review';
                team.gdriveLink       = carryLink;

                await team.save();
            }
        }

        res.status(200).json({
            globalRound: round,
            promoted: round > prevRound
                ? (await Team.countDocuments({ currentRound: round, submissionStatus: 'under_review' }))
                : 0
        });
    } catch (error) {
        console.error('Error in advanceRound:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─── POST /api/admin/teams/bulk-update ───────────────────────────────────────
// updates: [{ id, submissionStatus }]
// Works with the roundSubmissions array for the team's current round.
const bulkUpdateTeams = async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
        const { updates } = req.body;
        if (!Array.isArray(updates) || updates.length === 0)
            return res.status(400).json({ message: 'No updates provided.' });

        const validStatuses = ['not_submitted', 'under_review', 'rejected', 'shortlisted'];
        let modifiedCount = 0;

        for (const u of updates) {
            const team = await Team.findById(u.id);
            if (!team) continue;

            const round = team.currentRound ?? 0;

            if (u.submissionStatus && validStatuses.includes(u.submissionStatus)) {
                // Update roundSubmissions entry
                let entry = team.roundSubmissions.find(s => s.round === round);
                if (!entry) {
                    team.roundSubmissions.push({
                        round,
                        gdriveLink: team.gdriveLink || '',
                        submissionStatus: u.submissionStatus
                    });
                } else {
                    entry.submissionStatus = u.submissionStatus;
                }
                // Mirror to flat fields
                team.submissionStatus = u.submissionStatus;
            }

            await team.save();
            modifiedCount++;
        }

        res.status(200).json({ success: true, modified: modifiedCount });
    } catch (error) {
        console.error('Error in bulkUpdateTeams:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─── GET /api/admin/settings ──────────────────────────────────────────────────
const getSettings = async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
        const setting = await Settings.findOne({ key: 'globalRound' });
        res.status(200).json({ globalRound: setting?.value ?? 0 });
    } catch (error) {
        console.error('Error in getSettings:', error);
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

// ─── POST /api/admin/query ───────────────────────────────────────────────────
const executeQuery = async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
        const { collection, operation, filter, projection, sort, limit, pipeline, field } = req.body;
        if (!collection)
            return res.status(400).json({ message: 'Collection name is required.' });

        const db  = mongoose.connection.db;
        if (!db) return res.status(500).json({ message: 'Database connection not available.' });

        const col   = db.collection(collection);
        const start = Date.now();
        let result;

        switch (operation) {
            case 'find': {
                result = await col
                    .find(filter || {}, { projection: projection || {} })
                    .sort(sort || {})
                    .limit(Math.min(limit || 500, 2000))
                    .toArray();
                break;
            }
            case 'aggregate': {
                if (!Array.isArray(pipeline))
                    return res.status(400).json({ message: 'Pipeline must be an array.' });
                const safe = pipeline.some(s => '$limit' in s) ? pipeline : [...pipeline, { $limit: 2000 }];
                result = await col.aggregate(safe).toArray();
                break;
            }
            case 'count': {
                const count = await col.countDocuments(filter || {});
                result = [{ count }];
                break;
            }
            case 'distinct': {
                if (!field) return res.status(400).json({ message: 'Field is required for distinct.' });
                const values = await col.distinct(field, filter || {});
                result = values.map(v => ({ value: v }));
                break;
            }
            default:
                return res.status(400).json({ message: `Unsupported operation "${operation}".` });
        }

        res.status(200).json({
            success: true, operation, collection,
            count: result.length,
            executionTime: `${Date.now() - start}ms`,
            data: result
        });
    } catch (error) {
        console.error('Error in executeQuery:', error);
        res.status(500).json({ message: error.message || 'Query execution failed.', error: error.name });
    }
};

// ─── GET /api/admin/collections ──────────────────────────────────────────────
const listCollections = async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
        const db = mongoose.connection.db;
        if (!db) return res.status(500).json({ message: 'Database connection not available.' });
        const collections = await db.listCollections().toArray();
        res.status(200).json({ collections: collections.map(c => ({ name: c.name, type: c.type })) });
    } catch (error) {
        console.error('Error in listCollections:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = {
    getAllTeams,
    setVerdict,
    advanceRound,
    bulkUpdateTeams,
    getSettings,
    updateTeamVenue,
    executeQuery,
    listCollections
};
