const Team = require('../models/Team');

// ─── Global component inventory ───────────────────────────────────────────────
const COMPONENT_INVENTORY = {
    'ESP32 Development Board':          40,
    'MAX30102 Pulse Oximeter Sensor':   15,
    'ADXL345 Accelerometer Module':     25,
    'MQ-2 Gas Sensor Module':           25,
    'PIR Motion Sensor (HC-SR501)':     25,
    'Reed Switch Module':               25,
    'Servo Motor (SG90 9G)':            15,
    'Piezo Buzzer (Small)':             30,
    'Breadboard (400 Tie-Point)':       35,
    'Jumper Wires — Male to Male':      60,
    'Jumper Wires — Male to Female':    60,
    'Jumper Wires — Female to Female':  60,
};

// ─── Google Sheets sync (fire-and-forget) ─────────────────────────────────────
const syncToGoogleSheet = async (team) => {
    const svcEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key      = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId  = process.env.GOOGLE_SPREADSHEET_ID;

    if (!svcEmail || !key || !sheetId) return;

    try {
        const { GoogleSpreadsheet } = require('google-spreadsheet');
        const { JWT } = require('google-auth-library');

        const auth = new JWT({
            email:  svcEmail,
            key:    key.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(sheetId, auth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        // Ensure headers are set on first run
        const existingRows = await sheet.getRows({ limit: 1 });
        if (existingRows.length === 0) {
            await sheet.setHeaderRow([
                'Team Code', 'Team Name', 'Track', 'Team Members',
                'GDrive Submission', 'VTOP Registration Status', 'Claimed Components'
            ]);
        }

        const memberNames  = team.members.map(m => m.name).join(', ');
        const vtopStatuses = team.members
            .map(m => `${m.name}: ${m.vtopRegistered ? 'Yes' : 'No'}`)
            .join(' | ');
        const components   = team.claimedComponents.map(c => c.name).join(', ');

        const rows = await sheet.getRows();
        const existingRow = rows.find(r => r.get('Team Code') === team.teamCode);

        const rowData = {
            'Team Code':                team.teamCode,
            'Team Name':                team.teamName,
            'Track':                    team.trackChosen || '',
            'Team Members':             memberNames,
            'GDrive Submission':        team.gdriveLink || '',
            'VTOP Registration Status': vtopStatuses,
            'Claimed Components':       components,
        };

        if (existingRow) {
            Object.keys(rowData).forEach(k => existingRow.set(k, rowData[k]));
            await existingRow.save();
        } else {
            await sheet.addRow(rowData);
        }
    } catch (err) {
        console.error('[Sheets] Sync failed:', err.message);
    }
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const generateTeamCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const VIT_EMAIL_DOMAIN = '@vitstudent.ac.in';

// ─── POST /api/teams/create ───────────────────────────────────────────────────
const createTeam = async (req, res) => {
    try {
        const { teamName, leaderName, email, registrationNumber, phoneNumber, vtopRegistered, track } = req.body;

        if (!teamName || !leaderName || !email || !registrationNumber || !phoneNumber) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        if (!email.endsWith(VIT_EMAIL_DOMAIN)) {
            return res.status(400).json({ message: `Registration is restricted to ${VIT_EMAIL_DOMAIN} email addresses.` });
        }

        if (await Team.findOne({ teamName })) {
            return res.status(400).json({ message: 'Team name is already taken.' });
        }

        if (await Team.findOne({ 'members.email': email })) {
            return res.status(400).json({ message: 'You are already registered in a team.' });
        }

        let teamCode, isUnique = false;
        while (!isUnique) {
            teamCode = generateTeamCode();
            if (!(await Team.findOne({ teamCode }))) isUnique = true;
        }

        const newTeam = await Team.create({
            teamName,
            teamCode,
            trackChosen: track || '',
            members: [{
                name: leaderName,
                email,
                registrationNumber,
                phoneNumber,
                isLeader:       true,
                vtopRegistered: !!vtopRegistered,
                track:          track || ''
            }]
        });

        syncToGoogleSheet(newTeam).catch(() => {});

        res.status(201).json({
            message:  'Team created successfully!',
            teamCode: newTeam.teamCode,
            teamId:   newTeam._id
        });
    } catch (error) {
        console.error('Error in createTeam:', error);
        res.status(500).json({ message: 'Server error while creating team.' });
    }
};

// ─── POST /api/teams/join ─────────────────────────────────────────────────────
const joinTeam = async (req, res) => {
    try {
        const { teamCode, memberName, email, registrationNumber, phoneNumber, vtopRegistered, track } = req.body;

        if (!teamCode || !memberName || !email || !registrationNumber || !phoneNumber) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        if (!email.endsWith(VIT_EMAIL_DOMAIN)) {
            return res.status(400).json({ message: `Registration is restricted to ${VIT_EMAIL_DOMAIN} email addresses.` });
        }

        if (await Team.findOne({ 'members.email': email })) {
            return res.status(400).json({ message: 'You are already registered in a team.' });
        }

        const team = await Team.findOne({ teamCode: teamCode.toUpperCase() });
        if (!team) {
            return res.status(404).json({ message: 'Invalid Team Code. Team not found.' });
        }

        if (team.members.length >= 5) {
            return res.status(400).json({ message: 'This team has reached the maximum of 5 members.' });
        }

        if (team.members.some(m => m.registrationNumber === registrationNumber)) {
            return res.status(400).json({ message: 'Registration number already in this team.' });
        }

        team.members.push({
            name:           memberName,
            email,
            registrationNumber,
            phoneNumber,
            isLeader:       false,
            vtopRegistered: !!vtopRegistered,
            track:          track || ''
        });

        await team.save();
        syncToGoogleSheet(team).catch(() => {});

        res.status(200).json({
            message:     'Successfully joined the team!',
            teamName:    team.teamName,
            memberCount: team.members.length
        });
    } catch (error) {
        console.error('Error in joinTeam:', error);
        res.status(500).json({ message: 'Server error while joining team.' });
    }
};

// ─── GET /api/teams/user/:email ───────────────────────────────────────────────
const getTeamByUserEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const team = await Team.findOne({ 'members.email': email });

        if (!team) {
            return res.status(404).json({ message: 'No team found for this user.' });
        }

        res.status(200).json(team);
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ error: 'Server error while fetching team.' });
    }
};

// ─── POST /api/teams/submit-link ──────────────────────────────────────────────
const submitGdriveLink = async (req, res) => {
    try {
        const { email, gdriveLink } = req.body;

        if (!gdriveLink?.trim()) {
            return res.status(400).json({ message: 'Please provide a Google Drive link.' });
        }

        const team = await Team.findOne({ 'members.email': email });
        if (!team) {
            return res.status(404).json({ message: 'Team not found.' });
        }

        team.gdriveLink       = gdriveLink.trim();
        team.submissionStatus = 'under_review';
        await team.save();

        syncToGoogleSheet(team).catch(() => {});

        res.status(200).json({
            message:          'Link submitted successfully.',
            submissionStatus: team.submissionStatus,
            gdriveLink:       team.gdriveLink
        });
    } catch (error) {
        console.error('Error in submitGdriveLink:', error);
        res.status(500).json({ message: 'Server error while submitting link.' });
    }
};

// ─── GET /api/teams/inventory?email=... ──────────────────────────────────────
const getInventory = async (req, res) => {
    try {
        const { email } = req.query;

        const claimedCounts = await Team.aggregate([
            { $unwind: '$claimedComponents' },
            { $group: { _id: '$claimedComponents.name', count: { $sum: 1 } } }
        ]);

        const claimedMap = {};
        claimedCounts.forEach(item => { claimedMap[item._id] = item.count; });

        let teamClaimed = [];
        if (email) {
            const team = await Team.findOne({ 'members.email': email });
            if (team) teamClaimed = team.claimedComponents.map(c => c.name);
        }

        const inventory = Object.entries(COMPONENT_INVENTORY).map(([name, total]) => ({
            name,
            total,
            claimed:        claimedMap[name] || 0,
            remaining:      total - (claimedMap[name] || 0),
            teamHasClaimed: teamClaimed.includes(name)
        }));

        res.status(200).json({ inventory });
    } catch (error) {
        console.error('Error in getInventory:', error);
        res.status(500).json({ message: 'Server error while fetching inventory.' });
    }
};

// ─── POST /api/teams/claim-component ─────────────────────────────────────────
const claimComponent = async (req, res) => {
    try {
        const { email, componentName } = req.body;

        if (!componentName || !Object.prototype.hasOwnProperty.call(COMPONENT_INVENTORY, componentName)) {
            return res.status(400).json({ message: 'Invalid component name.' });
        }

        const team = await Team.findOne({ 'members.email': email });
        if (!team) return res.status(404).json({ message: 'Team not found.' });

        // Rule 1 — per-team limit
        if (team.claimedComponents.some(c => c.name === componentName)) {
            return res.status(400).json({ message: 'Your team has already claimed this component.' });
        }

        // Rule 2 — global stock
        const globalClaimed = await Team.countDocuments({ 'claimedComponents.name': componentName });
        if (globalClaimed >= COMPONENT_INVENTORY[componentName]) {
            return res.status(400).json({ message: 'This component is out of stock.' });
        }

        team.claimedComponents.push({ name: componentName });
        await team.save();
        syncToGoogleSheet(team).catch(() => {});

        res.status(200).json({
            message:           `${componentName} claimed successfully.`,
            claimedComponents: team.claimedComponents
        });
    } catch (error) {
        console.error('Error in claimComponent:', error);
        res.status(500).json({ message: 'Server error while claiming component.' });
    }
};

// ─── DELETE /api/teams/claim-component ───────────────────────────────────────
const unclaimComponent = async (req, res) => {
    try {
        const { email, componentName } = req.body;

        const team = await Team.findOne({ 'members.email': email });
        if (!team) return res.status(404).json({ message: 'Team not found.' });

        const before = team.claimedComponents.length;
        team.claimedComponents = team.claimedComponents.filter(c => c.name !== componentName);

        if (team.claimedComponents.length === before) {
            return res.status(400).json({ message: 'Component not in your claimed list.' });
        }

        await team.save();
        syncToGoogleSheet(team).catch(() => {});

        res.status(200).json({
            message:           `${componentName} removed.`,
            claimedComponents: team.claimedComponents
        });
    } catch (error) {
        console.error('Error in unclaimComponent:', error);
        res.status(500).json({ message: 'Server error while unclaiming component.' });
    }
};

// ─── PATCH /api/teams/vtop ────────────────────────────────────────────────────
const updateVtopStatus = async (req, res) => {
    try {
        const { email, vtopRegistered } = req.body;
        const team = await Team.findOne({ 'members.email': email });
        if (!team) return res.status(404).json({ message: 'Team not found.' });
        const member = team.members.find(m => m.email === email);
        if (!member) return res.status(404).json({ message: 'Member not found.' });
        member.vtopRegistered = !!vtopRegistered;
        await team.save();
        syncToGoogleSheet(team).catch(() => {});
        res.status(200).json({ message: 'VTOP status updated.', vtopRegistered: member.vtopRegistered });
    } catch (error) {
        console.error('Error in updateVtopStatus:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = {
    createTeam,
    joinTeam,
    getTeamByUserEmail,
    submitGdriveLink,
    getInventory,
    claimComponent,
    unclaimComponent,
    updateVtopStatus,
    COMPONENT_INVENTORY
};
