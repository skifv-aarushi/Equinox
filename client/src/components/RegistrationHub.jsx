/**
 * RegistrationHub.jsx
 *
 * Shown when the authenticated user is not yet in a team.
 * Two side-by-side panels:
 *   1. Create a Team → POST /api/teams/create
 *   2. Join a Team   → POST /api/teams/join
 *
 * Both panels include a VTOP acknowledgement checkbox with an OD warning.
 * Filling any field in one panel disables the other until cleared.
 */

import { useState, useEffect, useRef } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { useTeam } from '../context/TeamContext';
import { createTeam, joinTeam } from '../utils/api';
import './RegistrationHub.css';

const TRACKS = [
  'Smart Healthcare Systems',
  'Road Safety',
  'Social Wellness',
  'Smart Security',
  'Smart Home & Automation',
  'Open Innovation: Smart Infrastructure',
];

// ─── Reusable labelled input ───────────────────────────────────────────────
function Field({ label, id, value, onChange, placeholder, maxLength, required = true }) {
  return (
    <div className="rh-field">
      <label htmlFor={id} className="rh-label">{label}</label>
      <input
        id={id}
        className="rh-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        autoComplete="off"
      />
    </div>
  );
}

// ─── Track dropdown (custom) ──────────────────────────────────────────────────
function TrackSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (t) => {
    onChange(t);
    setOpen(false);
  };

  return (
    <div className="rh-field">
      <label className="rh-label">Track</label>
      <div className={`rh-dropdown${open ? ' rh-dropdown--open' : ''}`} ref={ref}>
        <button
          type="button"
          className={`rh-dropdown__trigger${!value ? ' rh-dropdown__trigger--placeholder' : ''}`}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>{value || 'Select a track…'}</span>
          <svg className="rh-dropdown__chevron" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        {open && (
          <ul className="rh-dropdown__list" role="listbox">
            {TRACKS.map((t) => (
              <li
                key={t}
                role="option"
                aria-selected={value === t}
                className={`rh-dropdown__item${value === t ? ' rh-dropdown__item--active' : ''}`}
                onMouseDown={() => handleSelect(t)}
              >
                {value === t && <span className="rh-dropdown__check">✓</span>}
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── VTOP acknowledgement checkbox ────────────────────────────────────────────
function VtopCheckbox({ checked, onChange }) {
  return (
    <div className="rh-vtop">
      {!checked && (
        <p className="rh-vtop__warning">
          ⚠ If not registered on VTOP, OD (on-duty) will <strong>not</strong> be provided for this participant.
        </p>
      )}
      <label className="rh-vtop__label">
        <input
          type="checkbox"
          className="rh-vtop__checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="rh-vtop__text">
          I have registered for this event on the <strong>VTOP</strong> portal.
        </span>
      </label>
    </div>
  );
}

// ─── Create Team Panel ─────────────────────────────────────────────────────
function CreatePanel({ isDisabled, onActivate, onDeactivate }) {
  const { user } = useUser();
  const { api, refreshTeam } = useTeam();

  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  const [teamName, setTeamName]   = useState('');
  const [name, setName]           = useState(user?.fullName ?? '');
  const [regNo, setRegNo]         = useState('');
  const [phone, setPhone]         = useState('');
  const [track, setTrack]         = useState('');
  const [vtop, setVtop]           = useState(false);
  const [loading, setLoading]     = useState(false);

  // Activate/deactivate based on user-typed fields (excluding pre-filled name)
  useEffect(() => {
    const hasContent = [teamName, regNo, phone].some(v => v.trim() !== '');
    if (hasContent) onActivate();
    else onDeactivate();
  }, [teamName, regNo, phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!teamName.trim() || !name.trim() || !regNo.trim() || !phone.trim() || !track) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating your team…');
    try {
      await createTeam(api, {
        teamName:           teamName.trim(),
        leaderName:         name.trim(),
        email,
        registrationNumber: regNo.trim(),
        phoneNumber:        phone.trim(),
        vtopRegistered:     vtop,
        track,
      });
      toast.success('Team created! You are the leader.', { id: toastId });
      await refreshTeam();
    } catch (err) {
      toast.error(err.message || 'Failed to create team.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rh-panel rh-panel--create${isDisabled ? ' rh-panel--disabled' : ''}`}>
      <div className="rh-panel__header">
        <span className="rh-panel__icon">
          {/* Create team — group / people icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </span>
        <h2 className="rh-panel__title">Create a Team</h2>
        <p className="rh-panel__sub">
          Start a new team and share the code with your members.
        </p>
      </div>

      <form onSubmit={handleCreate} className="rh-form" noValidate>
        <Field
          label="Team Name"
          id="create-team-name"
          value={teamName}
          onChange={setTeamName}
          placeholder="e.g. Stellar Minds"
        />
        <Field
          label="Your Full Name"
          id="create-member-name"
          value={name}
          onChange={setName}
          placeholder="As per college ID"
        />
        <Field
          label="Registration Number"
          id="create-reg-no"
          value={regNo}
          onChange={setRegNo}
          placeholder="e.g. 22BCE1234"
        />
        <Field
          label="Phone Number"
          id="create-phone"
          value={phone}
          onChange={setPhone}
          placeholder="+91 98765 43210"
          maxLength={15}
        />

        <TrackSelect value={track} onChange={setTrack} />

        <div className="rh-email-display">
          <span className="rh-email-label">Registered Email</span>
          <span className="rh-email-value">{email}</span>
        </div>

        <VtopCheckbox checked={vtop} onChange={setVtop} />

        <button
          type="submit"
          className="btn btn-primary rh-submit"
          disabled={loading}
        >
          {loading ? <><span className="rh-spinner" /> Creating…</> : 'Create Team'}
        </button>
      </form>
    </div>
  );
}

// ─── Join Team Panel ───────────────────────────────────────────────────────
function JoinPanel({ isDisabled, onActivate, onDeactivate }) {
  const { user } = useUser();
  const { api, refreshTeam } = useTeam();

  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  const [teamCode, setTeamCode]   = useState('');
  const [name, setName]           = useState(user?.fullName ?? '');
  const [regNo, setRegNo]         = useState('');
  const [phone, setPhone]         = useState('');
  const [track, setTrack]         = useState('');
  const [vtop, setVtop]           = useState(false);
  const [loading, setLoading]     = useState(false);

  // Activate/deactivate based on user-typed fields (excluding pre-filled name)
  useEffect(() => {
    const hasContent = [teamCode, regNo, phone].some(v => v.trim() !== '');
    if (hasContent) onActivate();
    else onDeactivate();
  }, [teamCode, regNo, phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCodeChange = (val) => setTeamCode(val.toUpperCase().slice(0, 8));

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!teamCode.trim() || !name.trim() || !regNo.trim() || !phone.trim() || !track) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Joining team…');
    try {
      await joinTeam(api, {
        teamCode:           teamCode.trim(),
        memberName:         name.trim(),
        email,
        registrationNumber: regNo.trim(),
        phoneNumber:        phone.trim(),
        vtopRegistered:     vtop,
        track,
      });
      toast.success("You've joined the team!", { id: toastId });
      await refreshTeam();
    } catch (err) {
      toast.error(err.message || 'Failed to join team.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rh-panel rh-panel--join${isDisabled ? ' rh-panel--disabled' : ''}`}>
      <div className="rh-panel__header">
        <span className="rh-panel__icon">
          {/* Join team — log-in / enter door icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
        </span>
        <h2 className="rh-panel__title">Join a Team</h2>
        <p className="rh-panel__sub">
          Enter the 6-character code your team leader shared with you.
        </p>
      </div>

      <form onSubmit={handleJoin} className="rh-form" noValidate>
        <div className="rh-field">
          <label htmlFor="join-code" className="rh-label">Team Code</label>
          <input
            id="join-code"
            className="rh-input rh-input--code"
            type="text"
            value={teamCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="XXXXXX"
            maxLength={8}
            required
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <Field
          label="Your Full Name"
          id="join-member-name"
          value={name}
          onChange={setName}
          placeholder="As per college ID"
        />
        <Field
          label="Registration Number"
          id="join-reg-no"
          value={regNo}
          onChange={setRegNo}
          placeholder="e.g. 22BCE1234"
        />
        <Field
          label="Phone Number"
          id="join-phone"
          value={phone}
          onChange={setPhone}
          placeholder="+91 98765 43210"
          maxLength={15}
        />

        <TrackSelect value={track} onChange={setTrack} />

        <div className="rh-email-display">
          <span className="rh-email-label">Registered Email</span>
          <span className="rh-email-value">{email}</span>
        </div>

        <VtopCheckbox checked={vtop} onChange={setVtop} />

        <button
          type="submit"
          className="btn btn-primary rh-submit"
          disabled={loading}
        >
          {loading ? <><span className="rh-spinner" /> Joining…</> : 'Join Team'}
        </button>
      </form>
    </div>
  );
}

const VIT_DOMAIN = '@vitstudent.ac.in';

// ─── RegistrationHub ───────────────────────────────────────────────────────
export default function RegistrationHub() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [signingOut, setSigningOut] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'create' | 'join' | null

  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const isVitEmail = email.endsWith(VIT_DOMAIN);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ redirectUrl: '/register' });
  };

  return (
    <div className="rh-root">
      <div className="rh-header">
        <p className="rh-header__pre accent-text">Equinox 2026 · Registration</p>
        <h1 className="rh-header__title">Join the<br />Cosmos</h1>
        <p className="rh-header__sub">
          Teams of 3–5 members. Create a team or join one with a code.
        </p>
      </div>

      {!isVitEmail ? (
        <div className="rh-domain-block">
          <span className="rh-domain-block__icon">⊗</span>
          <h3 className="rh-domain-block__title">Access Restricted</h3>
          <p className="rh-domain-block__msg">
            Registration is only open to VIT students.<br />
            Please sign in with your <strong>{VIT_DOMAIN}</strong> email address.
          </p>
          <p className="rh-domain-block__current">
            Signed in as: <span>{email || '—'}</span>
          </p>
          <button
            className="rh-domain-block__switch-btn"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut
              ? <><span className="rh-spinner" /> Signing out…</>
              : '↩ Sign in with a different account'}
          </button>
        </div>
      ) : (
        <div className="rh-panels">
          <CreatePanel
            isDisabled={activePanel === 'join'}
            onActivate={() => setActivePanel('create')}
            onDeactivate={() => setActivePanel(p => p === 'create' ? null : p)}
          />
          <div className="rh-divider">
            <span>or</span>
          </div>
          <JoinPanel
            isDisabled={activePanel === 'create'}
            onActivate={() => setActivePanel('join')}
            onDeactivate={() => setActivePanel(p => p === 'join' ? null : p)}
          />
        </div>
      )}
    </div>
  );
}
