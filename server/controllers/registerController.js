const Team = require('../models/Team');

const generateTeamCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// @desc    Create a new team (Leader Action)
// @route   POST /api/teams/create
const createTeam = async (req, res) => {
    try {
        // ADDED email here
        const { teamName, leaderName, email, registrationNumber, phoneNumber } = req.body;

        if (!teamName || !leaderName || !email || !registrationNumber || !phoneNumber) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        const existingTeam = await Team.findOne({ teamName });
        if (existingTeam) {
            return res.status(400).json({ message: 'Team name is already taken.' });
        }

        let teamCode;
        let isUnique = false;
        while (!isUnique) {
            teamCode = generateTeamCode();
            const existingCode = await Team.findOne({ teamCode });
            if (!existingCode) isUnique = true;
        }

        const newTeam = await Team.create({
            teamName,
            teamCode,
            members: [{
                name: leaderName,
                email, // Save email to DB
                registrationNumber,
                phoneNumber,
                isLeader: true
            }]
        });

        res.status(201).json({
            message: 'Team created successfully!',
            teamCode: newTeam.teamCode,
            teamId: newTeam._id
        });

    } catch (error) {
        console.error('Error in createTeam:', error);
        res.status(500).json({ message: 'Server error while creating team.' });
    }
};

// @desc    Join an existing team (Member Action)
// @route   POST /api/teams/join
const joinTeam = async (req, res) => {
    try {
        // ADDED email here
        const { teamCode, memberName, email, registrationNumber, phoneNumber } = req.body;

        if (!teamCode || !memberName || !email || !registrationNumber || !phoneNumber) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        const team = await Team.findOne({ teamCode: teamCode.toUpperCase() });

        if (!team) {
            return res.status(404).json({ message: 'Invalid Team Code. Team not found.' });
        }

        if (team.members.length >= 5) {
            return res.status(400).json({ message: 'This team has reached the limit of 5 members.' });
        }

        const isAlreadyMember = team.members.some(
            (member) => member.registrationNumber === registrationNumber || member.email === email
        );
        if (isAlreadyMember) {
            return res.status(400).json({ message: 'You are already registered in this team.' });
        }

        team.members.push({
            name: memberName,
            email, // Save email to DB
            registrationNumber,
            phoneNumber,
            isLeader: false
        });

        await team.save();

        res.status(200).json({
            message: 'Successfully joined the team!',
            teamName: team.teamName,
            memberCount: team.members.length
        });

    } catch (error) {
        console.error('Error in joinTeam:', error);
        res.status(500).json({ message: 'Server error while joining team.' });
    }
};

// @desc    Get team by user email
// @route   GET /api/teams/user/:email
const getTeamByUserEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const team = await Team.findOne({ "members.email": email });

        if (!team) {
            return res.status(404).json({ message: "No team found for this user." });
        }

        res.status(200).json(team);
    } catch (error) {
        console.error("Error fetching team:", error);
        res.status(500).json({ error: "Server error while fetching team." });
    }
};

module.exports = {
    createTeam,
    joinTeam,
    getTeamByUserEmail // Export the new function
};