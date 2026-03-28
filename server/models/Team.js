const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name:               { type: String, required: true },
    email:              { type: String, required: true },
    registrationNumber: { type: String, required: true },
    phoneNumber:        { type: String, required: true },
    isLeader:           { type: Boolean, default: false },
    vtopRegistered:     { type: Boolean, default: false }
});

const claimedComponentSchema = new mongoose.Schema({
    name:      { type: String, required: true },
    claimedAt: { type: Date, default: Date.now }
});

const teamSchema = new mongoose.Schema({
    teamName:  { type: String, required: true, unique: true },
    teamCode:  { type: String, required: true, unique: true },
    members:   [memberSchema],

    // Hackathon progression
    venue:        { type: String, default: '' },
    currentRound: { type: Number, default: 0, min: 0, max: 3 },

    // Submission
    gdriveLink:       { type: String, default: '' },
    submissionStatus: {
        type:    String,
        enum:    ['not_submitted', 'under_review', 'shortlisted'],
        default: 'not_submitted'
    },

    // Inventory
    claimedComponents: [claimedComponentSchema],

    // Legacy fields (kept for compatibility)
    trackChosen:      { type: String },
    problemStatement: { type: String },
    detailedSolution: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
