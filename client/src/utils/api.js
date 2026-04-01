/**
 * api.js — Authenticated Axios instance for Equinox backend.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function createApiClient(getToken) {
  const instance = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use(async (config) => {
    try {
      const token = await getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch { /* proceed without auth */ }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error  ||
        error?.message                ||
        'An unexpected error occurred.';
      return Promise.reject(new Error(message));
    }
  );

  return instance;
}

// ─── Team helpers ─────────────────────────────────────────────────────────────

export async function fetchTeamByEmail(api, email) {
  const res = await api.get(`/teams/user/${encodeURIComponent(email)}`);
  return res.data ?? null;
}

export async function createTeam(api, payload) {
  const res = await api.post('/teams/create', payload);
  return res.data;
}

export async function joinTeam(api, payload) {
  const res = await api.post('/teams/join', payload);
  return res.data;
}

export async function submitGdriveLink(api, payload) {
  const res = await api.post('/teams/submit-link', payload);
  return res.data;
}

export async function leaveTeam(api, payload) {
  const res = await api.delete('/teams/leave', { data: payload });
  return res.data;
}

export async function updateVtopStatus(api, payload) {
  const res = await api.patch('/teams/vtop', payload);
  return res.data;
}

// ─── Admin helpers ────────────────────────────────────────────────────────────

export async function fetchAllTeams(api) {
  const res = await api.get('/admin/teams');
  return res.data;
}

export async function fetchAdminSettings(api) {
  const res = await api.get('/admin/settings');
  return res.data;
}

// Advance global round (promotes shortlisted teams)
export async function advanceGlobalRound(api, round) {
  const res = await api.post('/admin/advance-round', { round });
  return res.data;
}

// Set verdict for a single team
export async function setTeamVerdict(api, teamId, submissionStatus) {
  const res = await api.put('/admin/verdict', { teamId, submissionStatus });
  return res.data;
}

// Bulk-update team statuses
export async function bulkUpdateTeamsApi(api, updates) {
  const res = await api.post('/admin/teams/bulk-update', { updates });
  return res.data;
}

export async function updateTeamVenue(api, teamId, venue) {
  const res = await api.patch(`/admin/teams/${teamId}/venue`, { venue });
  return res.data;
}

// ─── Admin Query Console ──────────────────────────────────────────────────────

export async function executeAdminQuery(api, queryPayload) {
  const res = await api.post('/admin/query', queryPayload);
  return res.data;
}

export async function fetchCollections(api) {
  const res = await api.get('/admin/collections');
  return res.data;
}
