/**
 * TeamDashboard.jsx
 *
 * Rendered when the authenticated user already has a team.
 *
 * Sections:
 *  – Hero band (team name + copyable code, venue, round)
 *  – Members grid
 *  – GDrive submission with colour-coded status
 *  – Component inventory selection
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { useTeam } from '../context/TeamContext';
import {
  submitGdriveLink,
  fetchInventory,
  claimComponent,
  unclaimComponent,
  updateVtopStatus
} from '../utils/api';
import './TeamDashboard.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROUND_LABELS = ['Round 0 — Registration', 'Round 1', 'Round 2', 'Round 3 — Finals'];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      className={`td-copy-btn ${copied ? 'td-copy-btn--copied' : ''}`}
      onClick={handleCopy}
      aria-label="Copy team code"
    >
      {copied ? '✓ Copied!' : '⎘ Copy'}
    </button>
  );
}

// ─── Member card ──────────────────────────────────────────────────────────────
function MemberCard({ member, index, isCurrentUser, api, onVtopChange }) {
  const isLeader = member.isLeader === true;
  const [updating, setUpdating] = useState(false);

  const handleVtopToggle = async (e) => {
    setUpdating(true);
    try {
      await updateVtopStatus(api, { email: member.email, vtopRegistered: e.target.checked });
      toast.success('VTOP status updated.');
      onVtopChange();
    } catch (err) {
      toast.error(err.message || 'Failed to update VTOP status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`td-member ${isLeader ? 'td-member--leader' : ''}`}>
      <div className="td-member__avatar">
        {member.name ? member.name.charAt(0).toUpperCase() : '?'}
      </div>
      <div className="td-member__info">
        <span className="td-member__name">{member.name || '—'}</span>
        <span className="td-member__reg">{member.registrationNumber || '—'}</span>
        <span className="td-member__email">{member.email || '—'}</span>
        {isCurrentUser ? (
          <label className="td-member__vtop-toggle" title="Click to toggle your VTOP registration">
            <input
              type="checkbox"
              checked={!!member.vtopRegistered}
              onChange={handleVtopToggle}
              disabled={updating}
              style={{ accentColor: 'var(--gold-subtle)' }}
            />
            <span className={`td-member__vtop ${member.vtopRegistered ? 'td-member__vtop--yes' : 'td-member__vtop--no'}`}>
              VTOP: {member.vtopRegistered ? 'Registered' : 'Not Registered'}
            </span>
          </label>
        ) : (
          <span className={`td-member__vtop ${member.vtopRegistered ? 'td-member__vtop--yes' : 'td-member__vtop--no'}`}>
            VTOP: {member.vtopRegistered ? 'Registered' : 'Not Registered'}
          </span>
        )}
      </div>
      {isLeader
        ? <span className="td-member__badge">☉ Leader</span>
        : <span className="td-member__index">#{index + 1}</span>
      }
    </div>
  );
}

// ─── Submission panel ─────────────────────────────────────────────────────────
function SubmissionPanel({ team, email, api, onUpdate }) {
  const [link, setLink]     = useState(team.gdriveLink || '');
  const [saving, setSaving] = useState(false);

  const status = team.submissionStatus || 'not_submitted';

  const statusConfig = {
    not_submitted: {
      color:   'red',
      label:   'No Submission',
      message: 'Please submit your Google Drive link.',
      icon:    '●'
    },
    under_review: {
      color:   'yellow',
      label:   'Under Review',
      message: 'Your submissions are under review.',
      icon:    '◐'
    },
    shortlisted: {
      color:   'green',
      label:   'Shortlisted',
      message: 'The submission has been shortlisted!',
      icon:    '◉'
    }
  };

  const cfg = statusConfig[status];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!link.trim()) {
      toast.error('Please enter a Google Drive link.');
      return;
    }
    setSaving(true);
    try {
      await submitGdriveLink(api, { email, gdriveLink: link.trim() });
      toast.success('Link submitted successfully!');
      onUpdate();
    } catch (err) {
      toast.error(err.message || 'Failed to submit link.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="td-submission">
      <div className="td-submission__header">
        <span className="td-submission__icon">◈</span>
        <h3 className="td-submission__title">Submission</h3>
        <span className={`td-submission__status td-submission__status--${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      <p className={`td-submission__message td-submission__message--${cfg.color}`}>
        {cfg.message}
      </p>

      <form onSubmit={handleSubmit} className="td-submission__form">
        <input
          className="td-submission__input"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://drive.google.com/..."
        />
        <button
          type="submit"
          className="btn btn-primary td-submission__btn"
          disabled={saving}
        >
          {saving ? <><span className="td-loading__spinner td-loading__spinner--sm" /> Saving…</> : 'Submit Link'}
        </button>
      </form>
    </div>
  );
}

// ─── Inventory panel ──────────────────────────────────────────────────────────
function InventoryPanel({ email, api, onUpdate }) {
  const [inventory, setInventory] = useState([]);
  const [loadingItem, setLoadingItem] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchInventory(api, email);
      setInventory(data.inventory || []);
    } catch (err) {
      console.error('Failed to load inventory:', err.message);
    }
  }, [api, email]);

  useEffect(() => { load(); }, [load]);

  const handleClaim = async (componentName) => {
    setLoadingItem(componentName);
    try {
      await claimComponent(api, { email, componentName });
      toast.success(`${componentName} claimed!`);
      await load();
      onUpdate();
    } catch (err) {
      toast.error(err.message || 'Failed to claim component.');
    } finally {
      setLoadingItem(null);
    }
  };

  const handleUnclaim = async (componentName) => {
    setLoadingItem(componentName);
    try {
      await unclaimComponent(api, { email, componentName });
      toast.success(`${componentName} removed.`);
      await load();
      onUpdate();
    } catch (err) {
      toast.error(err.message || 'Failed to remove component.');
    } finally {
      setLoadingItem(null);
    }
  };

  return (
    <div className="td-inventory">
      <div className="td-inventory__header">
        <span className="td-inventory__icon">⚙</span>
        <h3 className="td-inventory__title">Component Selection</h3>
        <span className="td-inventory__sub">Max 1 unit per component per team</span>
      </div>

      <div className="td-inventory__grid">
        {inventory.map((item) => {
          const outOfStock = item.remaining <= 0 && !item.teamHasClaimed;
          const isLoading  = loadingItem === item.name;

          return (
            <div
              key={item.name}
              className={`td-inv-item ${item.teamHasClaimed ? 'td-inv-item--claimed' : ''} ${outOfStock ? 'td-inv-item--empty' : ''}`}
            >
              <div className="td-inv-item__name">{item.name}</div>
              <div className="td-inv-item__stock">
                <span className={`td-inv-item__remaining ${item.remaining === 0 ? 'td-inv-item__remaining--zero' : ''}`}>
                  {item.remaining} / {item.total} left
                </span>
              </div>
              {item.teamHasClaimed ? (
                <button
                  className="td-inv-item__btn td-inv-item__btn--remove"
                  onClick={() => handleUnclaim(item.name)}
                  disabled={isLoading}
                >
                  {isLoading ? '…' : '✕ Remove'}
                </button>
              ) : (
                <button
                  className="td-inv-item__btn td-inv-item__btn--claim"
                  onClick={() => handleClaim(item.name)}
                  disabled={outOfStock || isLoading}
                >
                  {isLoading ? '…' : outOfStock ? 'Out of Stock' : '+ Claim'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TeamDashboard ─────────────────────────────────────────────────────────
export default function TeamDashboard() {
  const { team, isLoading, refreshTeam } = useTeam();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  const { api } = useTeam();

  if (isLoading) {
    return (
      <div className="td-loading">
        <span className="td-loading__spinner" />
        <p>Loading your team…</p>
      </div>
    );
  }

  if (!team) return null;

  const members     = Array.isArray(team.members) ? team.members : [];
  const memberCount = members.length;
  const round       = team.currentRound ?? 0;

  return (
    <div className="td-root">

      {/* ── Hero band ── */}
      <div className="td-hero">
        <p className="td-hero__pre accent-text">Your Team · Equinox 2026</p>

        <h1 className="td-hero__teamname">{team.teamName}</h1>

        <div className="td-code-block">
          <span className="td-code-block__label">Team Code</span>
          <div className="td-code-block__inner">
            <span className="td-code-block__code">{team.teamCode}</span>
            <CopyButton text={team.teamCode} />
          </div>
          <p className="td-code-block__hint">
            Share this code with your teammates so they can join.
          </p>
        </div>

        {/* Round + Venue row */}
        <div className="td-meta-row">
          <div className="td-meta-badge">
            <span className="td-meta-badge__label">Stage</span>
            <span className="td-meta-badge__value">{ROUND_LABELS[round]}</span>
          </div>
          {team.venue && (
            <div className="td-meta-badge">
              <span className="td-meta-badge__label">Venue</span>
              <span className="td-meta-badge__value">{team.venue}</span>
            </div>
          )}
        </div>

        {/* Round progress dots */}
        <div className="td-rounds">
          {[0, 1, 2, 3].map((r) => (
            <div
              key={r}
              className={`td-round-dot ${r <= round ? 'td-round-dot--active' : ''} ${r === round ? 'td-round-dot--current' : ''}`}
              title={ROUND_LABELS[r]}
            >
              {r}
            </div>
          ))}
        </div>
      </div>

      <div className="celestial-divider" style={{ margin: '0 auto', maxWidth: 800 }} />

      {/* ── Members grid ── */}
      <div className="td-section">
        <h2 className="td-section__title">
          Members
          <span className="td-section__count">{memberCount} / 4</span>
        </h2>

        {memberCount === 0 ? (
          <p className="td-empty">No members found. Share your code!</p>
        ) : (
          <div className="td-members">
            {members.map((m, i) => (
              <MemberCard
                key={m.email ?? i}
                member={m}
                index={i}
                isCurrentUser={m.email === email}
                api={api}
                onVtopChange={refreshTeam}
              />
            ))}
          </div>
        )}
      </div>

      <div className="celestial-divider" style={{ margin: '0 auto', maxWidth: 800 }} />

      {/* ── Submission panel ── */}
      <div className="td-section" id="submissions">
        <SubmissionPanel
          team={team}
          email={email}
          api={api}
          onUpdate={refreshTeam}
        />
      </div>

      <div className="celestial-divider" style={{ margin: '0 auto', maxWidth: 800 }} />

      {/* ── Component inventory ── */}
      <div className="td-section">
        <InventoryPanel
          email={email}
          api={api}
          onUpdate={refreshTeam}
        />
      </div>

    </div>
  );
}
