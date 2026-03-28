/**
 * RegistrationHub.jsx
 *
 * Shown when the authenticated user is not yet in a team.
 * Two side-by-side panels:
 *   1. Create a Team → POST /api/teams/create
 *   2. Join a Team   → POST /api/teams/join
 *
 * Both panels include a VTOP acknowledgement checkbox with an OD warning.
 */

import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { useTeam } from '../context/TeamContext';
import { createTeam, joinTeam } from '../utils/api';
import './RegistrationHub.css';

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

// ─── VTOP acknowledgement checkbox ────────────────────────────────────────────
function VtopCheckbox({ checked, onChange }) {
  return (
    <div className="rh-vtop">
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
      {!checked && (
        <p className="rh-vtop__warning">
          ⚠ If not registered on VTOP, OD (on-duty) will <strong>not</strong> be provided for this participant.
        </p>
      )}
    </div>
  );
}

// ─── Create Team Panel ─────────────────────────────────────────────────────
function CreatePanel() {
  const { user } = useUser();
  const { api, refreshTeam } = useTeam();

  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  const [teamName, setTeamName]   = useState('');
  const [name, setName]           = useState(user?.fullName ?? '');
  const [regNo, setRegNo]         = useState('');
  const [phone, setPhone]         = useState('');
  const [vtop, setVtop]           = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!teamName.trim() || !name.trim() || !regNo.trim() || !phone.trim()) {
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
    <div className="rh-panel rh-panel--create">
      <div className="rh-panel__header">
        <span className="rh-panel__icon">⊕</span>
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
function JoinPanel() {
  const { user } = useUser();
  const { api, refreshTeam } = useTeam();

  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  const [teamCode, setTeamCode]   = useState('');
  const [name, setName]           = useState(user?.fullName ?? '');
  const [regNo, setRegNo]         = useState('');
  const [phone, setPhone]         = useState('');
  const [vtop, setVtop]           = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleCodeChange = (val) => setTeamCode(val.toUpperCase().slice(0, 8));

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!teamCode.trim() || !name.trim() || !regNo.trim() || !phone.trim()) {
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
    <div className="rh-panel rh-panel--join">
      <div className="rh-panel__header">
        <span className="rh-panel__icon">⊗</span>
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

// ─── RegistrationHub ───────────────────────────────────────────────────────
export default function RegistrationHub() {
  return (
    <div className="rh-root">
      <div className="rh-header reveal">
        <p className="rh-header__pre accent-text">Equinox 2026 · Registration</p>
        <h1 className="rh-header__title">Join the<br />Cosmos</h1>
        <p className="rh-header__sub">
          Teams of 2–4 members. Create a team or join one with a code.
        </p>
      </div>

      <div className="rh-panels">
        <CreatePanel />
        <div className="rh-divider">
          <span>or</span>
        </div>
        <JoinPanel />
      </div>
    </div>
  );
}
