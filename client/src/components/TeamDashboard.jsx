/**
 * TeamDashboard.jsx
 *
 * Rendered when the authenticated user already has a team (team !== null).
 *
 * Shows:
 *  – Team name + copyable team code
 *  – Member cards (leader highlighted)
 *  – Static "Submission Details" section (to be wired up later)
 */

import { useState } from 'react';
import { useTeam } from '../context/TeamContext';
import './TeamDashboard.css';

// ─── Copy-to-clipboard button ──────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      className={`td-copy-btn ${copied ? 'td-copy-btn--copied' : ''}`}
      onClick={handleCopy}
      aria-label="Copy team code"
      title="Copy to clipboard"
    >
      {copied ? '✓ Copied!' : '⎘ Copy'}
    </button>
  );
}

// ─── Member card ───────────────────────────────────────────────────────────
function MemberCard({ member, index }) {
  const isLeader = member.isLeader === true;

  return (
    <div className={`td-member ${isLeader ? 'td-member--leader' : ''}`}>
      <div className="td-member__avatar">
        {member.name ? member.name.charAt(0).toUpperCase() : '?'}
      </div>
      <div className="td-member__info">
        <span className="td-member__name">{member.name || '—'}</span>
        <span className="td-member__reg">{member.registrationNumber || '—'}</span>
        <span className="td-member__email">{member.email || '—'}</span>
      </div>
      {isLeader && (
        <span className="td-member__badge" title="Team Leader">
          ☉ Leader
        </span>
      )}
      {!isLeader && (
        <span className="td-member__index">#{index + 1}</span>
      )}
    </div>
  );
}

// ─── Static submission details panel ──────────────────────────────────────
function SubmissionDetails() {
  return (
    <div className="td-submission">
      <div className="td-submission__header">
        <span className="td-submission__icon">◈</span>
        <h3 className="td-submission__title">Submission Details</h3>
        <span className="td-submission__badge">Coming Soon</span>
      </div>

      <div className="td-submission__fields">
        <div className="td-submission__field">
          <span className="td-submission__field-label">Track Chosen</span>
          <span className="td-submission__field-value td-submission__field-value--empty">
            Not submitted yet
          </span>
        </div>
        <div className="td-submission__field">
          <span className="td-submission__field-label">Problem Statement</span>
          <span className="td-submission__field-value td-submission__field-value--empty">
            Not submitted yet
          </span>
        </div>
        <div className="td-submission__field">
          <span className="td-submission__field-label">Drive / Repo Link</span>
          <span className="td-submission__field-value td-submission__field-value--empty">
            Not submitted yet
          </span>
        </div>
      </div>

      <p className="td-submission__note">
        Submission details will be enabled once the hackathon begins on April 1, 2026.
      </p>
    </div>
  );
}

// ─── TeamDashboard ─────────────────────────────────────────────────────────
export default function TeamDashboard() {
  const { team, isLoading } = useTeam();

  if (isLoading) {
    return (
      <div className="td-loading">
        <span className="td-loading__spinner" />
        <p>Loading your team…</p>
      </div>
    );
  }

  if (!team) return null;

  const members = Array.isArray(team.members) ? team.members : [];
  const memberCount = members.length;

  return (
    <div className="td-root">

      {/* ── Hero band ── */}
      <div className="td-hero reveal">
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
      </div>

      <div className="celestial-divider" style={{ margin: '0 auto', maxWidth: 800 }} />

      {/* ── Members grid ── */}
      <div className="td-section reveal">
        <h2 className="td-section__title">
          Members
          <span className="td-section__count">{memberCount} / 4</span>
        </h2>

        {memberCount === 0 ? (
          <p className="td-empty">No members found. Share your code!</p>
        ) : (
          <div className="td-members">
            {members.map((m, i) => (
              <MemberCard key={m.email ?? i} member={m} index={i} />
            ))}
          </div>
        )}
      </div>

      <div className="celestial-divider" style={{ margin: '0 auto', maxWidth: 800 }} />

      {/* ── Submission panel ── */}
      <div className="td-section reveal">
        <SubmissionDetails />
      </div>

    </div>
  );
}
