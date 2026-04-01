'use strict';
/**
 * load.js — Equinox backend load test
 *
 * Spins up a test HTTP server (in-memory MongoDB + mocked Clerk auth),
 * then runs 4 autocannon scenarios and prints a summary table.
 *
 * Usage:
 *   node server/load/load.js
 */

// ── Intercept @clerk/clerk-sdk-node BEFORE any routes are required ────────────
const Module = require('module');
const _origLoad = Module._load.bind(Module);
Module._load = function (request, ...args) {
    if (request === '@clerk/clerk-sdk-node') {
        return {
            ClerkExpressRequireAuth: () => (req, _res, next) => {
                req.auth = { userId: 'load_test_user' };
                next();
            },
            clerkClient: {
                users: {
                    getUser: () => Promise.resolve({
                        emailAddresses: [{ emailAddress: 'admin@vitstudent.ac.in' }],
                    }),
                },
            },
        };
    }
    return _origLoad(request, ...args);
};

const http        = require('http');
const mongoose    = require('mongoose');
const autocannon  = require('autocannon');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app         = require('../app');

// ── Helpers ───────────────────────────────────────────────────────────────────
const bench = (opts) =>
    new Promise((resolve, reject) =>
        autocannon(opts, (err, result) => (err ? reject(err) : resolve(result)))
    );

const col  = (v, w) => String(v).padStart(w);
const row  = (label, r) => {
    const ok = r.errors === 0 && r.timeouts === 0 ? '✓' : '✗';
    console.log(
        ` ${ok}  ${label.padEnd(42)} ` +
        `${col(r.requests.average.toFixed(0), 8)} req/s  ` +
        `${col(r.latency.average.toFixed(1), 7)} ms avg  ` +
        `${col(r.latency.p99 ?? 0, 7)} ms p99  ` +
        `err:${r.errors}  to:${r.timeouts}`
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
    console.log('\n☉  Equinox — Backend Load Test');
    console.log('   Starting in-memory MongoDB…\n');

    process.env.ADMIN_EMAILS = 'admin@vitstudent.ac.in';

    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const server = http.createServer(app);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;

    console.log(`   Listening on ${base}`);
    console.log('   Running scenarios (10 s each)…\n');

    const DURATION    = 10;  // seconds per scenario
    const results     = [];

    // ── 1. Health — pure throughput baseline ─────────────────────────────────
    results.push(['GET /api/health              (50 conn)', await bench({
        url: `${base}/api/health`,
        connections: 50,
        duration: DURATION,
        title: 'health',
    })]);

    // ── 2. Inventory — read-heavy, MongoDB aggregate ──────────────────────────
    results.push(['GET /api/teams/inventory     (20 conn)', await bench({
        url: `${base}/api/teams/inventory`,
        connections: 20,
        duration: DURATION,
        title: 'inventory',
    })]);

    // ── 3. User lookup — 404 path (no team seeded) ───────────────────────────
    results.push(['GET /api/teams/user/:email   (30 conn)', await bench({
        url: `${base}/api/teams/user/loadtest@vitstudent.ac.in`,
        connections: 30,
        duration: DURATION,
        title: 'user-lookup',
    })]);

    // ── 4. Create team — write-heavy, unique body per connection ─────────────
    let counter = 0;
    results.push(['POST /api/teams/create       (10 conn)', await bench({
        url:     `${base}/api/teams/create`,
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        setupClient: (client) => {
            const id = ++counter;
            client.setBody(JSON.stringify({
                teamName:           `LoadTeam_${id}_${Date.now()}`,
                leaderName:         'Load Tester',
                email:              `load${id}@vitstudent.ac.in`,
                registrationNumber: `22BCE${String(id).padStart(4, '0')}`,
                phoneNumber:        '9876543210',
                vtopRegistered:     false,
            }));
        },
        connections: 10,
        duration: DURATION,
        title: 'create-team',
    })]);

    // ── 5. Admin — get all teams ──────────────────────────────────────────────
    results.push(['GET /api/admin/teams         (10 conn)', await bench({
        url: `${base}/api/admin/teams`,
        connections: 10,
        duration: DURATION,
        title: 'admin-teams',
    })]);

    // ── Print table ───────────────────────────────────────────────────────────
    console.log('─'.repeat(100));
    console.log('    Scenario                                        Req/s    Latency avg    p99    Errors');
    console.log('─'.repeat(100));
    results.forEach(([label, r]) => row(label, r));
    console.log('─'.repeat(100));

    const allOk = results.every(([, r]) => r.errors === 0 && r.timeouts === 0);
    console.log(`\n   ${allOk ? '✓ All scenarios passed with zero errors.' : '✗ Some scenarios had errors — see table above.'}\n`);

    server.close();
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(allOk ? 0 : 1);
})().catch(err => {
    console.error('Load test failed:', err);
    process.exit(1);
});
