const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name:               { type: String, required: true },
    email:              { type: String, required: true },
    registrationNumber: { type: String, required: true },
    phoneNumber:        { type: String, required: true },
    isLeader:           { type: Boolean, default: false },
    vtopRegistered:     { type: Boolean, default: false },
    track:              { type: String, default: '' },
    gender:             { type: String, enum: ['male', 'female', 'other'], default: 'other' },
    hostelBlock:        { type: String, default: '' },
    roomNumber:         { type: String, default: '' }
});

// ─── Per-round submission history ─────────────────────────────────────────────
// One entry per round the team participates in.
// Carries the link forward so teams don't re-upload on every advance.
const roundSubmissionSchema = new mongoose.Schema({
    round:            { type: Number, required: true },
    gdriveLink:       { type: String, default: '' },
    submissionStatus: {
        type:    String,
        enum:    ['not_submitted', 'under_review', 'rejected', 'shortlisted'],
        default: 'not_submitted'
    }
}, { _id: false });

const teamSchema = new mongoose.Schema({
    teamName: { type: String, required: true, unique: true },
    teamCode: { type: String, required: true, unique: true },
    members: {
        type: [memberSchema],
        validate: {
            validator: function (arr) { return arr.length <= 5; },
            message:   'A team cannot have more than 5 members.'
        }
    },

    // Hackathon progression
    venue:        { type: String, default: '' },
    currentRound: { type: Number, default: 0, min: 0, max: 3 },

    // ── NEW: per-round submission history (primary data store) ─────────────────
    roundSubmissions: { type: [roundSubmissionSchema], default: [] },

    // ── Legacy flat fields (kept for backward-compat / migration) ──────────────
    gdriveLink:       { type: String, default: '' },
    submissionStatus: {
        type:    String,
        enum:    ['not_submitted', 'under_review', 'rejected', 'shortlisted'],
        default: 'not_submitted'
    },

    // Legacy problem-statement fields
    trackChosen:      { type: String },
    problemStatement: { type: String },
    detailedSolution: { type: String }
}, { timestamps: true });

// ─── Instance helper: get submission for a specific round ─────────────────────
teamSchema.methods.getSubmission = function (round) {
    const r = round ?? this.currentRound ?? 0;
    return (
        this.roundSubmissions.find(s => s.round === r) || {
            round: r,
            gdriveLink:       this.gdriveLink       || '',
            submissionStatus: this.submissionStatus || 'not_submitted'
        }
    );
};

module.exports = mongoose.model('Team', teamSchema);
