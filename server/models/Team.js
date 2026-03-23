const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    isLeader: { type: Boolean, default: false }
});

const teamSchema = new mongoose.Schema({
    teamName: { type: String, required: true },
    teamCode: { type: String, required: true, unique: true },
    members: [memberSchema], // Array holding 3 to 5 members
    trackChosen: { type: String },
    problemStatement: { type: String },
    detailedSolution: { type: String },
    vtopRegistered: {
        type: String,
        enum: ['Yes', 'No'],
        default: 'No'
    }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);