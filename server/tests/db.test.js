'use strict';
/**
 * db.test.js — Team mongoose model against an in-memory MongoDB
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Team = require('../models/Team');

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

// ─────────────────────────────────────────────────────────────────────────────

describe('Team schema — basic CRUD', () => {
    test('creates a team and persists defaults', async () => {
        const team = await Team.create({
            teamName: 'Stellar Minds',
            teamCode: 'STRM01',
            members: [{
                name: 'Alice',
                email: 'alice@vitstudent.ac.in',
                registrationNumber: '22BCE1001',
                phoneNumber: '9876543210',
                isLeader: true,
            }],
        });

        expect(team.teamName).toBe('Stellar Minds');
        expect(team.teamCode).toBe('STRM01');
        expect(team.members).toHaveLength(1);
        expect(team.members[0].isLeader).toBe(true);
        expect(team.members[0].vtopRegistered).toBe(false);
        expect(team.submissionStatus).toBe('not_submitted');
        expect(team.currentRound).toBe(0);
        expect(team.venue).toBe('');
        expect(team.gdriveLink).toBe('');
        expect(team.claimedComponents).toHaveLength(0);
        expect(team.createdAt).toBeInstanceOf(Date);
    });

    test('finds a team by member email', async () => {
        await Team.create({
            teamName: 'Nova Squad',
            teamCode: 'NOVA01',
            members: [{
                name: 'Bob',
                email: 'bob@vitstudent.ac.in',
                registrationNumber: '22BCE1002',
                phoneNumber: '9876543211',
            }],
        });

        const found = await Team.findOne({ 'members.email': 'bob@vitstudent.ac.in' });
        expect(found).not.toBeNull();
        expect(found.teamName).toBe('Nova Squad');
    });

    test('updates currentRound and persists', async () => {
        const team = await Team.create({ teamName: 'Round Team', teamCode: 'RND001', members: [] });
        await Team.findByIdAndUpdate(team._id, { currentRound: 2 });
        const updated = await Team.findById(team._id);
        expect(updated.currentRound).toBe(2);
    });

    test('updates submissionStatus to under_review', async () => {
        const team = await Team.create({ teamName: 'Sub Team', teamCode: 'SUB001', members: [] });
        team.submissionStatus = 'under_review';
        await team.save();
        const found = await Team.findById(team._id);
        expect(found.submissionStatus).toBe('under_review');
    });
});

describe('Team schema — uniqueness constraints', () => {
    test('rejects duplicate teamName', async () => {
        await Team.create({ teamName: 'Dup Team', teamCode: 'DUP001', members: [] });
        await expect(
            Team.create({ teamName: 'Dup Team', teamCode: 'DUP002', members: [] })
        ).rejects.toThrow();
    });

    test('rejects duplicate teamCode', async () => {
        await Team.create({ teamName: 'Team A', teamCode: 'SAME01', members: [] });
        await expect(
            Team.create({ teamName: 'Team B', teamCode: 'SAME01', members: [] })
        ).rejects.toThrow();
    });
});

describe('Team schema — validation', () => {
    test('rejects invalid submissionStatus enum', async () => {
        await expect(
            Team.create({ teamName: 'Bad Status', teamCode: 'BAD001', members: [], submissionStatus: 'approved' })
        ).rejects.toThrow();
    });

    test('rejects currentRound above max (3)', async () => {
        await expect(
            Team.create({ teamName: 'Bad Round', teamCode: 'BAD002', members: [], currentRound: 5 })
        ).rejects.toThrow();
    });

    test('rejects currentRound below min (0)', async () => {
        await expect(
            Team.create({ teamName: 'Neg Round', teamCode: 'BAD003', members: [], currentRound: -1 })
        ).rejects.toThrow();
    });

    test('rejects team with missing teamName', async () => {
        await expect(
            Team.create({ teamCode: 'BAD004', members: [] })
        ).rejects.toThrow();
    });
});

describe('Team schema — members sub-document', () => {
    test('adds members incrementally', async () => {
        const team = await Team.create({ teamName: 'Growing Team', teamCode: 'GRW001', members: [] });

        team.members.push({
            name: 'Carol',
            email: 'carol@vitstudent.ac.in',
            registrationNumber: '22BCE1003',
            phoneNumber: '9876543212',
        });
        await team.save();

        const found = await Team.findById(team._id);
        expect(found.members).toHaveLength(1);
    });

    test('supports up to 4 members (schema has no hard limit — enforced in controller)', async () => {
        const members = Array.from({ length: 4 }, (_, i) => ({
            name: `Member ${i}`,
            email: `m${i}@vitstudent.ac.in`,
            registrationNumber: `22BCE100${i}`,
            phoneNumber: `98765432${i}0`,
        }));
        const team = await Team.create({ teamName: 'Full Team', teamCode: 'FULL01', members });
        expect(team.members).toHaveLength(4);
    });
});

describe('Team schema — claimedComponents sub-document', () => {
    test('adds and removes claimed components', async () => {
        const team = await Team.create({ teamName: 'Comp Team', teamCode: 'CMP001', members: [] });

        team.claimedComponents.push({ name: 'ESP32 b type' });
        team.claimedComponents.push({ name: 'DHT 11 sensor' });
        await team.save();

        let found = await Team.findById(team._id);
        expect(found.claimedComponents).toHaveLength(2);

        found.claimedComponents = found.claimedComponents.filter(c => c.name !== 'ESP32 b type');
        await found.save();

        found = await Team.findById(team._id);
        expect(found.claimedComponents).toHaveLength(1);
        expect(found.claimedComponents[0].name).toBe('DHT 11 sensor');
    });

    test('claimedAt defaults to a Date', async () => {
        const team = await Team.create({ teamName: 'Time Team', teamCode: 'TIME01', members: [] });
        team.claimedComponents.push({ name: 'LDR module' });
        await team.save();

        const found = await Team.findById(team._id);
        expect(found.claimedComponents[0].claimedAt).toBeInstanceOf(Date);
    });
});

describe('Team schema — aggregate queries', () => {
    test('aggregate counts claimed components correctly', async () => {
        await Team.create({
            teamName: 'Agg Team 1', teamCode: 'AGG001', members: [],
            claimedComponents: [{ name: 'ESP32 b type' }, { name: 'IR sensor' }],
        });
        await Team.create({
            teamName: 'Agg Team 2', teamCode: 'AGG002', members: [],
            claimedComponents: [{ name: 'ESP32 b type' }],
        });

        const result = await Team.aggregate([
            { $unwind: '$claimedComponents' },
            { $group: { _id: '$claimedComponents.name', count: { $sum: 1 } } },
        ]);

        const espEntry = result.find(r => r._id === 'ESP32 b type');
        expect(espEntry.count).toBe(2);

        const irEntry = result.find(r => r._id === 'IR sensor');
        expect(irEntry.count).toBe(1);
    });
});
