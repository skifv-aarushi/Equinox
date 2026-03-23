const Team = require('../models/Team');

exports.getTeamByUserEmail = async (req, res) => {
    try {
        const { email } = req.params;

        // Find a team where at least one member has the matching email
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