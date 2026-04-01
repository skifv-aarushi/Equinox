'use strict';

jest.mock('@clerk/clerk-sdk-node', () => ({
    ClerkExpressRequireAuth: () => (req, _res, next) => { req.auth = { userId: 'u_test' }; next(); },
    clerkClient: { users: { getUser: jest.fn() } },
}));

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request  = require('supertest');
const app      = require('../app');

let mongod;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
}, 30000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

// ─────────────────────────────────────────────────────────────────────────────

test('GET /api/health → 200 with correct body', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', message: 'Equinox server running' });
});

test('GET /api/health → Content-Type is JSON', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/json/);
});

test('GET /unknown-spa-route → SPA fallback (200 or 404 if no build)', async () => {
    const res = await request(app).get('/some/spa/route');
    expect([200, 404]).toContain(res.status);
});
