/**
 * AdminPanel.jsx
 *
 * Protected admin dashboard. Only accessible to emails listed in
 * VITE_ADMIN_EMAILS (comma-separated env var).
 *
 * Features:
 *  – Table of all registered teams
 *  – Controls to update round, submission status, and venue
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { useTeam } from '../context/TeamContext';
import {
  fetchAllTeams,
  updateTeamRound,
  updateSubmissionStatus,
  updateTeamVenue
} from '../utils/api';
import './AdminPanel.css';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

const ROUND_LABELS = ['Round 0', 'Round 1', 'Round 2', 'Round 3'];

const STATUS_OPTIONS = [
  { value: 'not_submitted', label: 'Not Submitted' },
  { value: 'under_review',  label: 'Under Review'  },
  { value: 'shortlisted',   label: 'Shortlisted'    },
];

// ─── Individual team row ──────────────────────────────────────────────────────
function TeamRow({ team, api, onUpdated }) {
  const [round,  setRound]  = useState(team.currentRound ?? 0);
  const [status, setStatus] = useState(team.submissionStatus || 'not_submitted');
  const [venue,  setVenue]  = useState(team.venue || '');
  const [saving, setSaving] = useState(false);

  const handleRound = async (newRound) => {
    setRound(newRound);
    try {
      await updateTeamRound(api, team._id, Number(newRound));
      toast.success(`${team.teamName} → Round ${newRound}`);
      onUpdated();
    } catch (err) {
      toast.error(err.message || 'Failed to update round.');
    }
  };

  const handleStatus = async (newStatus) => {
    setStatus(newStatus);
    try {
      await updateSubmissionStatus(api, team._id, newStatus);
      toast.success(`${team.teamName} status updated.`);
      onUpdated();
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const handleVenueSave = async () => {
    setSaving(true);
    try {
      await updateTeamVenue(api, team._id, venue);
      toast.success(`Venue saved for ${team.teamName}.`);
      onUpdated();
    } catch (err) {
      toast.error(err.message || 'Failed to update venue.');
    } finally {
      setSaving(false);
    }
  };

  const vtopCount = team.members.filter(m => m.vtopRegistered).length;
  const members   = team.members.map(m => m.name).join(', ');
  const components = team.claimedComponents?.map(c => c.name).join(', ') || '—';

  return (
    <tr className="ap-row">
      <td className="ap-td ap-td--code">{team.teamCode}</td>
      <td className="ap-td ap-td--name">{team.teamName}</td>
      <td className="ap-td ap-td--members">
        <span className="ap-members">{members}</span>
        <span className="ap-vtop-count">VTOP: {vtopCount}/{team.members.length}</span>
      </td>
      <td className="ap-td ap-td--gdrive">
        {team.gdriveLink
          ? <a href={team.gdriveLink} target="_blank" rel="noopener noreferrer" className="ap-link">View Link</a>
          : <span className="ap-empty">—</span>
        }
      </td>
      <td className="ap-td ap-td--components">
        <span className="ap-components">{components}</span>
      </td>
      <td className="ap-td ap-td--round">
        <select
          className="ap-select"
          value={round}
          onChange={(e) => handleRound(e.target.value)}
        >
          {ROUND_LABELS.map((label, i) => (
            <option key={i} value={i}>{label}</option>
          ))}
        </select>
      </td>
      <td className="ap-td ap-td--status">
        <select
          className={`ap-select ap-select--status ap-select--${status.replace('_', '-')}`}
          value={status}
          onChange={(e) => handleStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </td>
      <td className="ap-td ap-td--venue">
        <div className="ap-venue-row">
          <input
            className="ap-input"
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Lab 301"
          />
          <button
            className="ap-btn"
            onClick={handleVenueSave}
            disabled={saving}
          >
            {saving ? '…' : 'Save'}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── AdminPanel ───────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user } = useUser();
  const { api }  = useTeam();

  const [teams,   setTeams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const isAdmin = ADMIN_EMAILS.includes(email);

  const load = useCallback(async () => {
    try {
      const data = await fetchAllTeams(api);
      setTeams(data.teams || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load teams.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <div className="ap-denied">
        <span className="ap-denied__icon">⊗</span>
        <h2 className="ap-denied__title">Access Denied</h2>
        <p className="ap-denied__sub">You do not have admin privileges.</p>
      </div>
    );
  }

  const filtered = teams.filter(t =>
    t.teamName.toLowerCase().includes(search.toLowerCase()) ||
    t.teamCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ap-root">
      <div className="ap-header">
        <p className="ap-header__pre accent-text">Equinox 2026 · Admin</p>
        <h1 className="ap-header__title">Admin Panel</h1>
        <p className="ap-header__sub">{teams.length} teams registered</p>
      </div>

      <div className="ap-toolbar">
        <input
          className="ap-search"
          type="text"
          placeholder="Search by team name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="ap-btn ap-btn--refresh" onClick={load}>
          ↺ Refresh
        </button>
      </div>

      {loading ? (
        <div className="ap-loading">
          <span className="ap-spinner" />
          <p>Loading teams…</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="ap-empty-state">No teams found.</p>
      ) : (
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th className="ap-th">Code</th>
                <th className="ap-th">Team Name</th>
                <th className="ap-th">Members</th>
                <th className="ap-th">GDrive</th>
                <th className="ap-th">Components</th>
                <th className="ap-th">Round</th>
                <th className="ap-th">Status</th>
                <th className="ap-th">Venue</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(team => (
                <TeamRow
                  key={team._id}
                  team={team}
                  api={api}
                  onUpdated={load}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
