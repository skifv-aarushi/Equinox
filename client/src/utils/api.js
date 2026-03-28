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

// ─── Endpoint helpers ─────────────────────────────────────────────────────────

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

export async function fetchInventory(api, email) {
  const res = await api.get(`/teams/inventory?email=${encodeURIComponent(email)}`);
  return res.data;
}

export async function claimComponent(api, payload) {
  const res = await api.post('/teams/claim-component', payload);
  return res.data;
}

export async function unclaimComponent(api, payload) {
  const res = await api.delete('/teams/claim-component', { data: payload });
  return res.data;
}

// ─── Admin helpers ────────────────────────────────────────────────────────────

export async function fetchAllTeams(api) {
  const res = await api.get('/admin/teams');
  return res.data;
}

export async function updateTeamRound(api, teamId, round) {
  const res = await api.patch(`/admin/teams/${teamId}/round`, { round });
  return res.data;
}

export async function updateSubmissionStatus(api, teamId, submissionStatus) {
  const res = await api.patch(`/admin/teams/${teamId}/submission-status`, { submissionStatus });
  return res.data;
}

export async function updateTeamVenue(api, teamId, venue) {
  const res = await api.patch(`/admin/teams/${teamId}/venue`, { venue });
  return res.data;
}

export async function submitComponentList(api, payload) {
  const res = await api.post('/teams/claim-components', payload);
  return res.data;
}

export async function updateVtopStatus(api, payload) {
  const res = await api.patch('/teams/vtop', payload);
  return res.data;
}
