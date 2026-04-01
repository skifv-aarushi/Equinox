/**
 * AdminPanel.jsx — Equinox 2026 Command Centre
 *
 * Features:
 *  – Tabbed layout: Teams | Query Console
 *  – Global Round control (advance-round promotes shortlisted)
 *  – Per-round submission status read from roundSubmissions[]
 *  – Bulk-publish verdicts with one button
 *  – GDrive open button per team row
 *  – Round-filtered team list (only advanced teams visible in R1+)
 *  – Simple MongoDB query editor with PDF download
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { useTeam } from '../context/TeamContext';
import {
  fetchAllTeams,
  executeAdminQuery,
  fetchAdminSettings,
  advanceGlobalRound,
  bulkUpdateTeamsApi
} from '../utils/api';
import './AdminPanel.css';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',').map(e => e.trim()).filter(Boolean);

const ROUND_LABELS = ['Round 0 — Registration', 'Round 1', 'Round 2', 'Round 3 — Finals'];

const STATUS_OPTIONS = [
  { value: 'not_submitted', label: 'Not Submitted' },
  { value: 'under_review',  label: 'Under Review'  },
  { value: 'rejected',      label: 'Rejected'       },
  { value: 'shortlisted',   label: 'Shortlisted'    },
];

// ─── Helper: get a team's status for a specific round ─────────────────────────
function getStatusForRound(team, round) {
  const entry = (team.roundSubmissions || []).find(s => s.round === round);
  if (entry) return entry.submissionStatus;
  // Fallback to flat field if this is the team's current round
  if (team.currentRound === round) return team.submissionStatus || 'not_submitted';
  return 'not_submitted';
}

function getGdriveLinkForRound(team, round) {
  const entry = (team.roundSubmissions || []).find(s => s.round === round);
  if (entry) return entry.gdriveLink || '';
  if (team.currentRound === round) return team.gdriveLink || '';
  return '';
}

// ─── Verdict helper ───────────────────────────────────────────────────────────
function getVerdict(status) {
  if (status === 'shortlisted')  return { text: 'Selected',     cls: 'ap-verdict--selected' };
  if (status === 'rejected')     return { text: 'Rejected',     cls: 'ap-verdict--rejected' };
  if (status === 'under_review') return { text: 'Under Review', cls: 'ap-verdict--review'   };
  return { text: 'Pending', cls: 'ap-verdict--pending' };
}

// ─── Team Row ─────────────────────────────────────────────────────────────────
function TeamRow({ team, localChange, onChange, globalRound }) {
  const dbStatus = getStatusForRound(team, globalRound);
  const status   = localChange?.submissionStatus ?? dbStatus;
  const isDirty  = !!localChange;
  const verdict  = getVerdict(status);
  const gdriveLink = getGdriveLinkForRound(team, globalRound);
  // Team's actual round (may be < globalRound if rejected/not advanced)
  const teamRound = team.currentRound ?? 0;

  const vtopCount = team.members.filter(m => m.vtopRegistered).length;
  const members   = team.members.map(m => m.name).join(', ');

  return (
    <tr className={`ap-row ${isDirty ? 'ap-row--dirty' : ''}`}>
      <td className="ap-td ap-td--code">
        {isDirty && <span className="ap-dirty-dot" title="Unpublished change" />}
        {team.teamCode}
      </td>
      <td className="ap-td ap-td--name">{team.teamName}</td>
      <td className="ap-td ap-td--members">
        <span className="ap-members">{members}</span>
        <span className="ap-vtop-count">VTOP: {vtopCount}/{team.members.length}</span>
      </td>
      <td className="ap-td ap-td--gdrive">
        {gdriveLink
          ? <a href={gdriveLink} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn--gdrive">⬡ Drive</a>
          : <span className="ap-empty">—</span>
        }
      </td>
      <td className="ap-td ap-td--round-badge">
        <span className="ap-round-badge">R{teamRound}</span>
      </td>
      <td className="ap-td ap-td--status">
        <select
          className={`ap-select ap-select--status ap-select--${status.replace('_', '-')}`}
          value={status}
          onChange={e => onChange(team._id, 'submissionStatus', e.target.value)}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className={`ap-verdict ${verdict.cls}`}>{verdict.text}</span>
      </td>
    </tr>
  );
}

// ─── Teams Tab ────────────────────────────────────────────────────────────────
function TeamsTab({ teams, loading, load, search, setSearch, api, globalRound, onSetGlobalRound }) {
  const [localChanges, setLocalChanges] = useState({});
  const [publishing, setPublishing]     = useState(false);
  const [settingRound, setSettingRound] = useState(false);

  const pendingCount = Object.keys(localChanges).length;

  // Filter logic:
  // R0: show all teams
  // R1+: show only teams whose currentRound >= globalRound
  //       (i.e. they were promoted — shortlisted in the previous round)
  const filtered = teams.filter(t => {
    const matchSearch = t.teamName.toLowerCase().includes(search.toLowerCase()) ||
                        t.teamCode.toLowerCase().includes(search.toLowerCase());
    const matchRound = globalRound === 0
      ? true
      : t.currentRound >= globalRound;
    return matchSearch && matchRound;
  });

  const handleChange = (teamId, field, value) => {
    setLocalChanges(prev => ({
      ...prev,
      [teamId]: { ...(prev[teamId] || {}), [field]: value }
    }));
  };

  const publishResults = async () => {
    if (pendingCount === 0) { toast('No pending changes to publish.'); return; }
    setPublishing(true);
    const updates = Object.entries(localChanges).map(([id, changes]) => ({
      id,
      ...changes,
    }));
    try {
      const result = await bulkUpdateTeamsApi(api, updates);
      toast.success(`✓ Published ${result.modified ?? pendingCount} update${pendingCount !== 1 ? 's' : ''}`);
      setLocalChanges({});
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to publish results.');
    } finally {
      setPublishing(false);
    }
  };

  const handleSetRound = async (r) => {
    setSettingRound(true);
    try {
      const result = await onSetGlobalRound(r);
      setLocalChanges({});
      load();
      if (result?.promoted > 0) {
        toast.success(`${result.promoted} team${result.promoted !== 1 ? 's' : ''} promoted to Round ${r}`);
      }
    } finally {
      setSettingRound(false);
    }
  };

  return (
    <>
      {/* ── Global Round Control ── */}
      <div className="ap-global-round">
        <div className="ap-global-round__left">
          <span className="ap-global-round__label">Active Round</span>
          <div className="ap-global-round__btns">
            {[0, 1, 2, 3].map(r => (
              <button
                key={r}
                className={`ap-round-btn ${globalRound === r ? 'ap-round-btn--active' : ''}`}
                onClick={() => handleSetRound(r)}
                disabled={settingRound || globalRound === r}
              >
                R{r}
              </button>
            ))}
          </div>
          <span className="ap-global-round__info">
            {globalRound === 0
              ? `All teams · ${filtered.length} total`
              : `Round ${globalRound} · ${filtered.length} team${filtered.length !== 1 ? 's' : ''} advanced`}
          </span>
        </div>

        <div className="ap-global-round__right">
          {pendingCount > 0 && (
            <span className="ap-pending-badge">{pendingCount} unsaved</span>
          )}
          <button
            className={`ap-btn ap-btn--publish ${pendingCount === 0 ? 'ap-btn--publish-dim' : ''}`}
            onClick={publishResults}
            disabled={publishing}
          >
            {publishing ? '⟳ Publishing…' : `⬆ Publish Results${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="ap-toolbar">
        <input
          className="ap-search"
          type="text"
          placeholder="Search by team name or code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="ap-btn ap-btn--refresh" onClick={load}>↺ Refresh</button>
      </div>

      {loading ? (
        <div className="ap-loading">
          <span className="ap-spinner" />
          <p>Loading teams…</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="ap-empty-state">{teams.length === 0 ? 'No teams found.' : 'No teams match this round filter.'}</p>
      ) : (
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th className="ap-th">Code</th>
                <th className="ap-th">Team Name</th>
                <th className="ap-th">Members</th>
                <th className="ap-th">GDrive</th>
                <th className="ap-th">Round</th>
                <th className="ap-th">Status / Verdict</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(team => (
                <TeamRow
                  key={team._id}
                  team={team}
                  localChange={localChanges[team._id]}
                  onChange={handleChange}
                  globalRound={globalRound}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── Query Console ────────────────────────────────────────────────────────────
function QueryConsole({ api }) {
  const [queryText,   setQueryText]   = useState('{\n  "collection": "teams",\n  "operation": "find",\n  "filter": {},\n  "limit": 50\n}');
  const [results,     setResults]     = useState(null);
  const [error,       setError]       = useState('');
  const [executing,   setExecuting]   = useState(false);

  const execute = async () => {
    setExecuting(true); setError(''); setResults(null);
    try {
      const payload = JSON.parse(queryText);
      if (!payload.collection || !payload.operation) {
        throw new Error('Please specify "collection" and "operation".');
      }
      const data = await executeAdminQuery(api, payload);
      setResults(data);
      toast.success(`Query successful (${data.count} result${data.count !== 1 ? 's' : ''})`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Query failed.');
      toast.error('Query failed.');
    } finally {
      setExecuting(false);
    }
  };

  const downloadPDF = async () => {
    if (!results?.data?.length) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    const opInfo = JSON.parse(queryText).operation || 'query';
    doc.text(`Query Results (${opInfo}) · ${results.count} records`, 14, 15);
    const keys = Object.keys(results.data[0] || {}).filter(k => k !== '__v');
    autoTable(doc, {
      startY: 22,
      head: [keys],
      body: results.data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')?.slice(0, 80))),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [40, 50, 78] },
    });
    doc.save(`query-results-${Date.now()}.pdf`);
  };

  return (
    <div className="qc-root" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="qc-toolbar" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button className="qc-run-btn" onClick={execute} disabled={executing}>
          {executing ? '⟳ Running…' : '▶ Run Query'}
        </button>
        {results?.data?.length > 0 && (
          <button className="qc-download-btn" onClick={downloadPDF}>⬇ Download PDF</button>
        )}
      </div>

      <textarea
        className="qc-editor"
        value={queryText}
        onChange={e => setQueryText(e.target.value)}
        spellCheck={false}
        placeholder='{ "collection": "teams", "operation": "find", "filter": {} }'
        style={{ minHeight: '300px', padding: '1rem', fontFamily: 'monospace', background: 'rgba(15, 21, 35, 0.7)', color: '#fff', border: '1px solid var(--gold-line)', borderRadius: '8px' }}
      />

      {error && <div className="qc-error"><span>⚠</span> {error}</div>}

      {results && (
        <div className="qc-results" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="qc-results__header">
            <span className="qc-results__count">{results.count} result{results.count !== 1 ? 's' : ''} returned in {results.executionTime}</span>
          </div>
          <pre className="qc-json" style={{ background: 'rgba(15, 21, 35, 0.5)', padding: '1rem', borderRadius: '8px', overflow: 'auto', maxHeight: '500px', border: '1px solid var(--gold-line)', marginTop: '0.5rem' }}>
            {JSON.stringify(results.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── AdminPanel ───────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user, isLoaded } = useUser();
  const { api }            = useTeam();

  const [activeTab,   setActiveTab]   = useState('teams');
  const [teams,       setTeams]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState('');
  const [globalRound, setGlobalRound] = useState(0);

  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const isAdmin = ADMIN_EMAILS.includes(email);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllTeams(api);
      setTeams(data.teams || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load teams.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Load teams + settings on mount
  useEffect(() => {
    if (!isAdmin || !isLoaded) return;
    load();
    fetchAdminSettings(api)
      .then(d => setGlobalRound(d.globalRound ?? 0))
      .catch(() => {});
  }, [isAdmin, isLoaded, load, api]);

  const handleSetGlobalRound = async (round) => {
    try {
      const result = await advanceGlobalRound(api, round);
      setGlobalRound(round);
      toast.success(`Active round set to Round ${round}`);
      return result;
    } catch (err) {
      toast.error(err.message || 'Failed to set round.');
      throw err;
    }
  };

  if (!isLoaded) return <div className="ap-loading"><span className="ap-spinner" /></div>;

  if (!isAdmin) {
    return (
      <div className="ap-access-denied">
        <div className="ap-access-denied__inner">
          <span className="ap-access-denied__icon">⊘</span>
          <h2>Access Restricted</h2>
          <p>You don't have admin access. Signed in as <strong>{email || 'unknown'}</strong>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ap-root">
      <div className="ap-header">
        <div className="ap-header__left">
          <h1 className="ap-header__title">Command Centre</h1>
          <span className="ap-header__sub">Equinox 2026 · Admin</span>
        </div>
        <div className="ap-header__meta">
          <span className="ap-header__email">{email}</span>
          <span className="ap-header__round-badge">Round {globalRound}</span>
        </div>
      </div>

      <div className="ap-tabs">
        <button className={`ap-tab ${activeTab === 'teams' ? 'ap-tab--active' : ''}`} onClick={() => setActiveTab('teams')}>
          ⊞ Teams
          {teams.length > 0 && <span className="ap-tab__count">{teams.length}</span>}
        </button>
        <button className={`ap-tab ${activeTab === 'query' ? 'ap-tab--active' : ''}`} onClick={() => setActiveTab('query')}>
          ⌬ Query Console
        </button>
      </div>

      <div className="ap-body">
        {activeTab === 'teams' && (
          <TeamsTab
            teams={teams}
            loading={loading}
            load={load}
            search={search}
            setSearch={setSearch}
            api={api}
            globalRound={globalRound}
            onSetGlobalRound={handleSetGlobalRound}
          />
        )}
        {activeTab === 'query' && <QueryConsole api={api} />}
      </div>
    </div>
  );
}
