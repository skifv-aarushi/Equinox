'use strict';
/**
 * admin.test.js — Integration tests for /api/admin/* endpoints
 * Clerk middleware + clerkClient are mocked to simulate an admin user.
 */

jest.mock('@clerk/clerk-sdk-node', () => ({
    ClerkExpressRequireAuth: () => (req, _res, next) => {
        req.auth = { userId: 'clerk_admin_user' };
        next();
    },
    clerkClient: {
        users: {
            getUser: jest.fn().mockResolvedValue({
                emailAddresses: [{ emailAddress: 'admin@vitstudent.ac.in' }],
            }),
        },
    },
}));

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request  = require('supertest');
const app      = require('../app');
const Team     = require('../models/Team');

let mongod;

beforeAll(async () => {
    process.env.ADMIN_EMAILS = 'admin@vitstudent.ac.in';
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

// ── Fixture ───────────────────────────────────────────────────────────────────
const seedTeam = () =>
    Team.create({
        teamName: 'Admin Test Team',
        teamCode: 'ADMN01',
        members: [{
            name:               'Alice',
            email:              'alice@vitstudent.ac.in',
            registrationNumber: '22BCE1001',
            phoneNumber:        '9876543210',
            isLeader:           true,
        }],
    });

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/admin/teams', () => {
    test('200 — returns empty array when no teams', async () => {
        const res = await request(app).get('/api/admin/teams');
        expect(res.status).toBe(200);
        expect(res.body.teams).toHaveLength(0);
    });

    test('200 — returns all teams sorted by createdAt desc', async () => {
        await seedTeam();
        await Team.create({ teamName: 'Team 2', teamCode: 'ADMN02', members: [] });

        const res = await request(app).get('/api/admin/teams');
        expect(res.status).toBe(200);
        expect(res.body.teams).toHaveLength(2);

        const times = res.body.teams.map(t => new Date(t.createdAt).getTime());
        expect(times[0]).toBeGreaterThanOrEqual(times[1]);
    });

    test('200 — team document includes members array', async () => {
        await seedTeam();
        const res = await request(app).get('/api/admin/teams');
        expect(res.body.teams[0].members).toHaveLength(1);
        expect(res.body.teams[0].members[0].name).toBe('Alice');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/admin/teams/:id/round', () => {
    test('200 — updates round to 1', async () => {
        const team = await seedTeam();
        const res  = await request(app)
            .patch(`/api/admin/teams/${team._id}/round`)
            .send({ round: 1 });
        expect(res.status).toBe(200);
        expect(res.body.team.currentRound).toBe(1);
    });

    test('200 — updates round to max (3)', async () => {
        const team = await seedTeam();
        const res  = await request(app)
            .patch(`/api/admin/teams/${team._id}/round`)
            .send({ round: 3 });
        expect(res.status).toBe(200);
        expect(res.body.team.currentRound).toBe(3);
    });

    test('200 — resets round to 0', async () => {
        const team = await seedTeam();
        await request(app).patch(`/api/admin/teams/${team._id}/round`).send({ round: 2 });
        const res  = await request(app)
            .patch(`/api/admin/teams/${team._id}/round`)
            .send({ round: 0 });
        expect(res.status).toBe(200);
        expect(res.body.team.currentRound).toBe(0);
    });

    test('400 — round above 3 is rejected', async () => {
        const team = await seedTeam();
        const res  = await request(app)
            .patch(`/api/admin/teams/${team._id}/round`)
            .send({ round: 4 });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/0.+3/);
    });

    test('400 — round below 0 is rejected', async () => {
        const team = await seedTeam();
        const res  = await request(app)
            .patch(`/api/admin/teams/${team._id}/round`)
            .send({ round: -1 });
        expect(res.status).toBe(400);
    });

    test('400 — missing round field', async () => {
        const team = await seedTeam();
        const res  = await request(app)
            .patch(`/api/admin/teams/${team._id}/round`)
            .send({});
        expect(res.status).toBe(400);
    });

    test('404 — nonexistent team id', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res    = await request(app)
            .patch(`/api/admin/teams/${fakeId}/round`)
            .send({ round: 1 });
        expect(res.status).toBe(404);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/admin/teams/:id/submission-status', () => {
    test('200 — sets status to under_review', async () => {
        const team = await seedTeam();
        const res  = await request(app)
            .patch(`/api/admin/teams/${team._id}/submission-status`)
            .send({ submissionStatus: 'under_review' });
        expect(res.status).toBe(200);
        expect(res.body.team.submissionStatus).toBe('under_review');
    });

    test('200 — sets status to shortlisted', async () => {
        const team = await seedTeam();
        const res  = await request(app)
            .patch(`/api/admin/teams/${team._id}/submission-status`)
            .send({ submissionStatus: 'shortlisted' });
        expect(res.status).toBe(200);
        expect(res.body.team.submissionStatus).toBe('shortlisted');
    });

    test('200 — resets status to not_submitted', async () => {
        const team = await seedTeam();
        const res  = await request(app)
            .patch(`/api/admin/teams/${team._id}/submission-status`)
            .send({ submissionStatus: 'not_submitted' });
        expect(res.status).toBe(200);
        expect(res.body.team.submissionStatus).toBe('not_submitted');
    });

    test('400 — invalid status value', async () => {
        const team = await seedTeam();
        const res  = await request(app)
            .patch(`/api/admin/teams/${team._id}/submission-status`)
            .send({ submissionStatus: 'approved' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid status/i);
    });

    test('404 — nonexistent team', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res    = await request(app)
            .patch(`/api/admin/teams/${fakeId}/submission-status`)
            .send({ submissionStatus: 'shortlisted' });
        expect(res.status).toBe(404);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/admin/teams/:id/venue', () => {
    test('200 — sets venue string', async () => {
        const team = await seedTeam();
        const res  = await request(app)
            .patch(`/api/admin/teams/${team._id}/venue`)
            .send({ venue: 'SJT Hall B' });
        expect(res.status).toBe(200);
        expect(res.body.team.venue).toBe('SJT Hall B');
    });

    test('200 — clears venue with empty string', async () => {
        const team = await seedTeam();
        await request(app).patch(`/api/admin/teams/${team._id}/venue`).send({ venue: 'SJT Hall B' });
        const res  = await request(app)
            .patch(`/api/admin/teams/${team._id}/venue`)
            .send({ venue: '' });
        expect(res.status).toBe(200);
        expect(res.body.team.venue).toBe('');
    });

    test('200 — omitting venue field clears it (defaults to empty string)', async () => {
        const team = await seedTeam();
        const res  = await request(app)
            .patch(`/api/admin/teams/${team._id}/venue`)
            .send({});
        expect(res.status).toBe(200);
        expect(res.body.team.venue).toBe('');
    });

    test('404 — nonexistent team', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res    = await request(app)
            .patch(`/api/admin/teams/${fakeId}/venue`)
            .send({ venue: 'Lab 1' });
        expect(res.status).toBe(404);
    });
});
