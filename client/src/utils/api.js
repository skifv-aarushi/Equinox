/**
 * api.js — Authenticated Axios instance for Equinox backend.
 *
 * Usage:
 *   import { createApiClient } from '../utils/api';
 *   const api = createApiClient(getToken);
 *   const res = await api.get('/teams/user/test@vit.ac.in');
 *
 * We expose a factory so each caller can pass in Clerk's getToken function
 * without breaking hook rules (hooks can only be called inside components).
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Creates an axios instance pre-configured with the Clerk JWT.
 * @param {() => Promise<string|null>} getToken – Clerk's useAuth().getToken
 */
export function createApiClient(getToken) {
  const instance = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
  });

  // Request interceptor: attach JWT before every call
  instance.interceptors.request.use(async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // If token retrieval fails, proceed without auth (server will 401)
    }
    return config;
  });

  // Response interceptor: unwrap data & normalise errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'An unexpected error occurred.';
      return Promise.reject(new Error(message));
    }
  );

  return instance;
}

// ─── Named endpoint helpers (used inside TeamContext / components) ────────────

/** GET /api/teams/user/:email */
export async function fetchTeamByEmail(api, email) {
  const res = await api.get(`/teams/user/${encodeURIComponent(email)}`);
  return res.data ?? null;
}

/** POST /api/teams/create */
export async function createTeam(api, payload) {
  const res = await api.post('/teams/create', payload);
  return res.data;
}

/** POST /api/teams/join */
export async function joinTeam(api, payload) {
  const res = await api.post('/teams/join', payload);
  return res.data;
}
