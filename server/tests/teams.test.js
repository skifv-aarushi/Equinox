'use strict';
/**
 * teams.test.js — Integration tests for /api/teams/* endpoints
 * Clerk auth middleware is mocked to inject a fake req.auth.
 */

jest.mock('@clerk/clerk-sdk-node', () => ({
    ClerkExpressRequireAuth: () => (req, _res, next) => {
        req.auth = { userId: 'clerk_test_user' };
        next();
    },
    clerkClient: { users: { getUser: jest.fn() } },
}));

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request  = require('supertest');
const app      = require('../app');
const Team     = require('../models/Team');

let mongod;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
}, 30000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

afterEach(async () => {
    await Team.deleteMany({});
});

// ── Shared fixture ────────────────────────────────────────────────────────────
const LEADER = {
    teamName:           'Stellar Minds',
    leaderName:         'Alice Kumar',
    email:              'alice@vitstudent.ac.in',
    registrationNumber: '22BCE1001',
    phoneNumber:        '9876543210',
    vtopRegistered:     true,
};

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/teams/create', () => {
    test('201 — creates team with valid data, returns teamCode (6 chars)', async () => {
        const res = await request(app).post('/api/teams/create').send(LEADER);
        expect(res.status).toBe(201);
        expect(res.body.teamCode).toHaveLength(6);
        expect(res.body.message).toMatch(/created/i);
        expect(res.body.teamId).toBeDefined();
    });

    test('400 — missing required fields', async () => {
        const res = await request(app).post('/api/teams/create').send({ teamName: 'Only Name' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/required/i);
    });

    test('400 — non-VIT email is rejected', async () => {
        const res = await request(app)
            .post('/api/teams/create')
            .send({ ...LEADER, email: 'alice@gmail.com' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/vitstudent/i);
    });

    test('400 — duplicate team name', async () => {
        await request(app).post('/api/teams/create').send(LEADER);
        const res = await request(app).post('/api/teams/create').send({
            ...LEADER,
            email:              'bob@vitstudent.ac.in',
            registrationNumber: '22BCE1002',
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/taken/i);
    });

    test('400 — duplicate email across teams', async () => {
        await request(app).post('/api/teams/create').send(LEADER);
        const res = await request(app).post('/api/teams/create').send({
            ...LEADER,
            teamName: 'Other Team',
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already registered/i);
    });

    test('persists the team in MongoDB', async () => {
        await request(app).post('/api/teams/create').send(LEADER);
        const team = await Team.findOne({ teamName: 'Stellar Minds' });
        expect(team).not.toBeNull();
        expect(team.members[0].email).toBe('alice@vitstudent.ac.in');
        expect(team.members[0].isLeader).toBe(true);
        expect(team.members[0].vtopRegistered).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/teams/join', () => {
    let teamCode;

    beforeEach(async () => {
        const res = await request(app).post('/api/teams/create').send(LEADER);
        teamCode = res.body.teamCode;
    });

    const BOB = {
        memberName:         'Bob Singh',
        email:              'bob@vitstudent.ac.in',
        registrationNumber: '22BCE1002',
        phoneNumber:        '9876543211',
    };

    test('200 — joins with valid code, memberCount becomes 2', async () => {
        const res = await request(app).post('/api/teams/join').send({ teamCode, ...BOB });
        expect(res.status).toBe(200);
        expect(res.body.memberCount).toBe(2);
        expect(res.body.teamName).toBe('Stellar Minds');
    });

    test('400 — missing required fields', async () => {
        const res = await request(app).post('/api/teams/join').send({ teamCode });
        expect(res.status).toBe(400);
    });

    test('400 — non-VIT email rejected', async () => {
        const res = await request(app).post('/api/teams/join').send({
            teamCode, ...BOB, email: 'bob@gmail.com',
        });
        expect(res.status).toBe(400);
    });

    test('404 — invalid / nonexistent team code', async () => {
        const res = await request(app).post('/api/teams/join').send({
            teamCode: 'XXXXXX', ...BOB,
        });
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/not found/i);
    });

    test('400 — team code is case-insensitive (lowercase accepted)', async () => {
        const res = await request(app).post('/api/teams/join').send({
            teamCode: teamCode.toLowerCase(), ...BOB,
        });
        expect(res.status).toBe(200);
    });

    test('400 — duplicate email (leader tries to join their own team)', async () => {
        const res = await request(app).post('/api/teams/join').send({
            teamCode,
            memberName:         'Alice Again',
            email:              'alice@vitstudent.ac.in',
            registrationNumber: '22BCE1099',
            phoneNumber:        '9876543299',
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already registered/i);
    });

    test('400 — duplicate registration number in same team', async () => {
        await request(app).post('/api/teams/join').send({ teamCode, ...BOB });
        const res = await request(app).post('/api/teams/join').send({
            teamCode,
            memberName:         'Bob Clone',
            email:              'bobclone@vitstudent.ac.in',
            registrationNumber: BOB.registrationNumber,
            phoneNumber:        '9876543211',
        });
        expect(res.status).toBe(400);
    });

    test('400 — team full after 4 members', async () => {
        for (let i = 2; i <= 4; i++) {
            await request(app).post('/api/teams/join').send({
                teamCode,
                memberName:         `Member ${i}`,
                email:              `member${i}@vitstudent.ac.in`,
                registrationNumber: `22BCE100${i}`,
                phoneNumber:        `987654321${i}`,
            });
        }
        const res = await request(app).post('/api/teams/join').send({
            teamCode,
            memberName:         'Member 5',
            email:              'member5@vitstudent.ac.in',
            registrationNumber: '22BCE1005',
            phoneNumber:        '9876543215',
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/maximum/i);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/teams/user/:email', () => {
    beforeEach(async () => {
        await request(app).post('/api/teams/create').send(LEADER);
    });

    test('200 — returns team document for known email', async () => {
        const res = await request(app).get('/api/teams/user/alice@vitstudent.ac.in');
        expect(res.status).toBe(200);
        expect(res.body.teamName).toBe('Stellar Minds');
        expect(res.body.members[0].email).toBe('alice@vitstudent.ac.in');
    });

    test('404 — returns 404 for unknown email', async () => {
        const res = await request(app).get('/api/teams/user/nobody@vitstudent.ac.in');
        expect(res.status).toBe(404);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/teams/submit-link', () => {
    beforeEach(async () => {
        await request(app).post('/api/teams/create').send(LEADER);
    });

    test('200 — submits link and sets status to under_review', async () => {
        const res = await request(app).post('/api/teams/submit-link').send({
            email:      'alice@vitstudent.ac.in',
            gdriveLink: 'https://drive.google.com/file/testlink',
        });
        expect(res.status).toBe(200);
        expect(res.body.submissionStatus).toBe('under_review');
        expect(res.body.gdriveLink).toBe('https://drive.google.com/file/testlink');
    });

    test('200 — trims whitespace from link', async () => {
        const res = await request(app).post('/api/teams/submit-link').send({
            email:      'alice@vitstudent.ac.in',
            gdriveLink: '   https://drive.google.com/file/trimmed   ',
        });
        expect(res.status).toBe(200);
        expect(res.body.gdriveLink).toBe('https://drive.google.com/file/trimmed');
    });

    test('400 — empty link string', async () => {
        const res = await request(app).post('/api/teams/submit-link').send({
            email:      'alice@vitstudent.ac.in',
            gdriveLink: '',
        });
        expect(res.status).toBe(400);
    });

    test('400 — whitespace-only link', async () => {
        const res = await request(app).post('/api/teams/submit-link').send({
            email:      'alice@vitstudent.ac.in',
            gdriveLink: '   ',
        });
        expect(res.status).toBe(400);
    });

    test('404 — team not found for given email', async () => {
        const res = await request(app).post('/api/teams/submit-link').send({
            email:      'nobody@vitstudent.ac.in',
            gdriveLink: 'https://drive.google.com/file/x',
        });
        expect(res.status).toBe(404);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/teams/inventory', () => {
    test('200 — returns all inventory items with expected shape', async () => {
        const res = await request(app).get('/api/teams/inventory');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.inventory)).toBe(true);
        expect(res.body.inventory.length).toBe(11); // 11 components defined

        const esp = res.body.inventory.find(i => i.name === 'ESP32 b type');
        expect(esp).toMatchObject({ total: 25, claimed: 0, remaining: 25, teamHasClaimed: false });
    });

    test('200 — teamHasClaimed is false when no email provided', async () => {
        const res = await request(app).get('/api/teams/inventory');
        res.body.inventory.forEach(item => {
            expect(item.teamHasClaimed).toBe(false);
        });
    });

    test('200 — claimed/remaining update after a claim', async () => {
        await request(app).post('/api/teams/create').send(LEADER);
        await request(app).post('/api/teams/claim-component').send({
            email: 'alice@vitstudent.ac.in', componentName: 'ESP32 b type',
        });

        const res = await request(app).get('/api/teams/inventory?email=alice@vitstudent.ac.in');
        const esp = res.body.inventory.find(i => i.name === 'ESP32 b type');
        expect(esp.claimed).toBe(1);
        expect(esp.remaining).toBe(24);
        expect(esp.teamHasClaimed).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/teams/claim-component', () => {
    beforeEach(async () => {
        await request(app).post('/api/teams/create').send(LEADER);
    });

    test('200 — claims a valid component', async () => {
        const res = await request(app).post('/api/teams/claim-component').send({
            email:         'alice@vitstudent.ac.in',
            componentName: 'DHT 11 sensor',
        });
        expect(res.status).toBe(200);
        expect(res.body.claimedComponents.some(c => c.name === 'DHT 11 sensor')).toBe(true);
    });

    test('200 — can claim multiple different components', async () => {
        await request(app).post('/api/teams/claim-component').send({
            email: 'alice@vitstudent.ac.in', componentName: 'ESP32 b type',
        });
        const res = await request(app).post('/api/teams/claim-component').send({
            email: 'alice@vitstudent.ac.in', componentName: 'IR sensor',
        });
        expect(res.status).toBe(200);
        expect(res.body.claimedComponents).toHaveLength(2);
    });

    test('400 — invalid (nonexistent) component name', async () => {
        const res = await request(app).post('/api/teams/claim-component').send({
            email:         'alice@vitstudent.ac.in',
            componentName: 'Flux Capacitor',
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid component/i);
    });

    test('400 — duplicate claim for same component', async () => {
        await request(app).post('/api/teams/claim-component').send({
            email: 'alice@vitstudent.ac.in', componentName: 'LDR module',
        });
        const res = await request(app).post('/api/teams/claim-component').send({
            email: 'alice@vitstudent.ac.in', componentName: 'LDR module',
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already claimed/i);
    });

    test('404 — team not found', async () => {
        const res = await request(app).post('/api/teams/claim-component').send({
            email:         'nobody@vitstudent.ac.in',
            componentName: 'ESP32 b type',
        });
        expect(res.status).toBe(404);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/teams/claim-component', () => {
    beforeEach(async () => {
        await request(app).post('/api/teams/create').send(LEADER);
        await request(app).post('/api/teams/claim-component').send({
            email:         'alice@vitstudent.ac.in',
            componentName: 'IR sensor',
        });
    });

    test('200 — unclaims a component, list becomes empty', async () => {
        const res = await request(app).delete('/api/teams/claim-component').send({
            email:         'alice@vitstudent.ac.in',
            componentName: 'IR sensor',
        });
        expect(res.status).toBe(200);
        expect(res.body.claimedComponents).toHaveLength(0);
        expect(res.body.message).toMatch(/removed/i);
    });

    test('400 — component not in claimed list', async () => {
        const res = await request(app).delete('/api/teams/claim-component').send({
            email:         'alice@vitstudent.ac.in',
            componentName: 'Breadboard 400 tiepoint',
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/not in your claimed list/i);
    });

    test('404 — team not found', async () => {
        const res = await request(app).delete('/api/teams/claim-component').send({
            email:         'nobody@vitstudent.ac.in',
            componentName: 'IR sensor',
        });
        expect(res.status).toBe(404);
    });
});
