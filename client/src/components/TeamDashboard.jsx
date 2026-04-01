/**
 * TeamDashboard.jsx
 *
 * Rendered when the authenticated user already has a team.
 *
 * Sections:
 *  – Hero band (team name + copyable code, venue, round)
 *  – Round progress timeline with per-round status colouring
 *  – Verdict banner (selected/rejected/under review/pending)
 *  – Members grid
 *  – GDrive submission (disabled when rejected)
 */

import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { useTeam } from '../context/TeamContext';
import {
  submitGdriveLink,
  updateVtopStatus,
  leaveTeam
} from '../utils/api';
import './TeamDashboard.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROUND_LABELS = ['Round 0 — Registration', 'Round 1', 'Round 2', 'Round 3 — Finals'];

// Get the submission entry for a given round from the roundSubmissions array
function getSubmission(team, round) {
  const entry = (team.roundSubmissions || []).find(s => s.round === round);
  if (entry) return entry;
  // Fallback to flat fields if roundSubmissions hasn't been populated yet
  if (round === (team.currentRound ?? 0)) {
    return {
      round,
      gdriveLink:       team.gdriveLink       || '',
      submissionStatus: team.submissionStatus || 'not_submitted'
    };
  }
  return { round, gdriveLink: '', submissionStatus: 'not_submitted' };
}

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

// ─── VTOP caution popup ──────────────────────────────────────────────────────
function VtopCaution({ email, vtopRegistered, api, onUpdate }) {
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating]   = useState(false);

  // Show if user hasn't registered on VTOP and hasn't dismissed
  if (vtopRegistered || dismissed) return null;

  const handleAcknowledge = async () => {
    setUpdating(true);
    try {
      await updateVtopStatus(api, { email, vtopRegistered: true });
      toast.success('VTOP status updated.');
      onUpdate();
      setDismissed(true);
    } catch (err) {
      toast.error(err.message || 'Failed to update VTOP status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="td-vtop-caution">
      <div className="td-vtop-caution__icon">⚠</div>
      <div className="td-vtop-caution__body">
        <p className="td-vtop-caution__title">VTOP Registration Required</p>
        <p className="td-vtop-caution__msg">
          If not registered on VTOP, OD (on-duty) will <strong>not</strong> be provided for this participant.
        </p>
        <label className="td-vtop-caution__label">
          <input
            type="checkbox"
            className="td-vtop-caution__checkbox"
            onChange={handleAcknowledge}
            disabled={updating}
          />
          <span>I have registered for this event on the VTOP portal.</span>
        </label>
      </div>
    </div>
  );
}

// ─── Member card ──────────────────────────────────────────────────────────────
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
        <span className={`td-member__vtop ${member.vtopRegistered ? 'td-member__vtop--yes' : 'td-member__vtop--no'}`}>
          VTOP: {member.vtopRegistered ? 'Registered' : 'Not Registered'}
        </span>
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
  const round   = team.currentRound ?? 0;
  const sub     = getSubmission(team, round);
  const status  = sub.submissionStatus;
  const isRejected = status === 'rejected';

  const [link, setLink]     = useState(sub.gdriveLink || '');
  const [saving, setSaving] = useState(false);

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
      message: 'Your submission is under review.',
      icon:    '◐'
    },
    shortlisted: {
      color:   'green',
      label:   'Shortlisted',
      message: 'Your submission has been shortlisted!',
      icon:    '◉'
    },
    rejected: {
      color:   'red',
      label:   'Rejected',
      message: 'Your team was not selected for this round. Submissions are disabled.',
      icon:    '✕'
    }
  };

  const cfg = statusConfig[status] || statusConfig.not_submitted;

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
        <h3 className="td-submission__title">Submission — {ROUND_LABELS[round] || `Round ${round}`}</h3>
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
          disabled={isRejected}
        />
        <button
          type="submit"
          className="btn btn-primary td-submission__btn"
          disabled={saving || isRejected}
        >
          {saving ? <><span className="td-loading__spinner td-loading__spinner--sm" /> Saving…</> : 'Submit Link'}
        </button>
      </form>
    </div>
  );
}

// ─── Leave Team button ───────────────────────────────────────────────────────
function LeaveButton({ email, api, onLeft }) {
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving]       = useState(false);

  const handleLeave = async () => {
    setLeaving(true);
    const toastId = toast.loading('Leaving team…');
    try {
      await leaveTeam(api, { email });
      toast.success('You have left the team.', { id: toastId });
      onLeft();
    } catch (err) {
      toast.error(err.message || 'Failed to leave team.', { id: toastId });
    } finally {
      setLeaving(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        className="td-leave-btn"
        onClick={() => setConfirming(true)}
      >
        ↩ Leave Team
      </button>
    );
  }

  return (
    <div className="td-leave-confirm">
      <p className="td-leave-confirm__msg">
        Are you sure? You can join or create a new team afterward.
      </p>
      <div className="td-leave-confirm__actions">
        <button
          type="button"
          className="td-leave-confirm__yes"
          onClick={handleLeave}
          disabled={leaving}
        >
          {leaving ? 'Leaving…' : 'Yes, leave'}
        </button>
        <button
          type="button"
          className="td-leave-confirm__no"
          onClick={() => setConfirming(false)}
          disabled={leaving}
        >
          Cancel
        </button>
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
  const currentSub  = getSubmission(team, round);
  const currentStatus = currentSub.submissionStatus;

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

        {/* Round + Status row */}
        <div className="td-meta-row">
          <div className="td-meta-badge td-meta-badge--wide">
            <span className="td-meta-badge__label">Stage</span>
            <span className="td-meta-badge__value">{ROUND_LABELS[round]}</span>
          </div>
        </div>

        {/* Round progress dots — colour-coded per round status */}
        <div className="td-rounds">
          {[0, 1, 2, 3].map((r) => {
            const sub    = getSubmission(team, r);
            const rStatus = sub.submissionStatus;

            // Determine dot class:
            // - active = team has reached or passed this round
            // - current = this is the team's current round
            // - rejected = team was rejected at this round (red)
            // - shortlisted = team passed this round (green)
            let dotCls = 'td-round-dot';
            if (r <= round) dotCls += ' td-round-dot--active';
            if (r === round) dotCls += ' td-round-dot--current';
            if (rStatus === 'rejected')    dotCls += ' td-round-dot--rejected';
            if (rStatus === 'shortlisted') dotCls += ' td-round-dot--shortlisted';

            return (
              <div
                key={r}
                className={dotCls}
                title={`${ROUND_LABELS[r]} — ${rStatus.replace('_', ' ')}`}
              >
                {r}
              </div>
            );
          })}
        </div>

        {/* ── Verdict banner ── */}
        {(() => {
          const roundLabel = ROUND_LABELS[round] || `Round ${round}`;
          let verdictIcon, verdictTitle, verdictMsg, verdictCls;

          if (currentStatus === 'shortlisted') {
            verdictIcon  = '✦';
            verdictTitle = `Selected — ${roundLabel}`;
            verdictMsg   = 'Congratulations! Your team has been selected to advance to the next round.';
            verdictCls   = 'td-verdict--selected';
          } else if (currentStatus === 'under_review') {
            verdictIcon  = '◐';
            verdictTitle = `Under Review — ${roundLabel}`;
            verdictMsg   = 'Your submission is being reviewed by our team. Results will be announced soon.';
            verdictCls   = 'td-verdict--review';
          } else if (currentStatus === 'rejected') {
            verdictIcon  = '✕';
            verdictTitle = `Not Selected — ${roundLabel}`;
            verdictMsg   = 'Unfortunately your team has not been selected to move forward. Thank you for participating!';
            verdictCls   = 'td-verdict--rejected';
          } else {
            verdictIcon  = '○';
            verdictTitle = 'Awaiting Submission';
            verdictMsg   = 'Submit your Google Drive project link below to begin the review process.';
            verdictCls   = 'td-verdict--pending';
          }

          return (
            <div className={`td-verdict ${verdictCls}`}>
              <span className="td-verdict__icon">{verdictIcon}</span>
              <div className="td-verdict__body">
                <span className="td-verdict__title">{verdictTitle}</span>
                <span className="td-verdict__msg">{verdictMsg}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── VTOP caution popup ── */}
      {(() => {
        const me = members.find(m => m.email === email);
        return me ? (
          <VtopCaution
            email={email}
            vtopRegistered={me.vtopRegistered}
            api={api}
            onUpdate={refreshTeam}
          />
        ) : null;
      })()}

      <div className="celestial-divider" style={{ margin: '0 auto', maxWidth: 800 }} />

      {/* ── Members grid ── */}
      <div className="td-section">
        <h2 className="td-section__title">
          Members
          <span className="td-section__count">{memberCount} / 5</span>
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

        <LeaveButton email={email} api={api} onLeft={refreshTeam} />
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


    </div>
  );
}
