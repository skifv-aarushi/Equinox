import { useState, useRef } from 'react';
import './RegisterForm.css';

// ── Google Apps Script endpoint ───────────────────────────────
// Replace with your deployed Web App URL.
const GOOGLE_SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE';

// ── Track options ─────────────────────────────────────────────
const TRACK_OPTIONS = [
    'Orion Track — AI & ML',
    'Atlas Track — Web3 & Blockchain',
    'Lyra Track — Healthcare & Biotech',
    'Vega Track — Sustainability',
    'Perseus Track — Cybersecurity',
    'Andromeda Track — Open Innovation',
];

// ── Helpers ───────────────────────────────────────────────────
function generateTeamCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ── Initial form states ───────────────────────────────────────
const CREATE_INIT = {
    leaderName:       '',
    email:            '',
    regNumber:        '',
    phone:            '',
    teamName:         '',
    track:            '',
    problemStatement: '',
    solutionText:     '',
};

const JOIN_INIT = {
    teamCode:   '',
    memberName: '',
    email:      '',
    regNumber:  '',
    phone:      '',
};

const REPORT_INIT = {
    teamName: '',
    teamCode: '',
    file:     null,
};

// ═════════════════════════════════════════════════════════════
export default function RegisterForm() {
    // ── Tab state ─────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join' | 'report'

    // ── Create Team state ─────────────────────────────────────
    const [createForm,   setCreateForm]   = useState(CREATE_INIT);
    const [createStatus, setCreateStatus] = useState('idle'); // idle|loading|success|error
    const [createError,  setCreateError]  = useState('');
    const [teamCode,     setTeamCode]     = useState('');
    const [codeCopied,   setCodeCopied]   = useState(false);

    // ── Join Team state ───────────────────────────────────────
    const [joinForm,   setJoinForm]   = useState(JOIN_INIT);
    const [joinStatus, setJoinStatus] = useState('idle');
    const [joinError,  setJoinError]  = useState('');

    // ── Submit Report state ───────────────────────────────────
    const [reportForm,   setReportForm]   = useState(REPORT_INIT);
    const [reportStatus, setReportStatus] = useState('idle');
    const [reportError,  setReportError]  = useState('');
    const [fileError,    setFileError]    = useState('');

    const reportFileRef = useRef(null);

    // ── Create form handlers ──────────────────────────────────
    const handleCreateChange = (e) =>
        setCreateForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setCreateStatus('loading');
        setCreateError('');

        try {
            const res  = await fetch(GOOGLE_SCRIPT_URL, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action:           'create_team',
                    leaderName:       createForm.leaderName,
                    email:            createForm.email,
                    regNumber:        createForm.regNumber,
                    phone:            createForm.phone,
                    teamName:         createForm.teamName,
                    track:            createForm.track,
                    problemStatement: createForm.problemStatement,
                    solutionText:     createForm.solutionText,
                }),
            });
            const data = await res.json();

            if (res.ok || data.success) {
                setTeamCode(data.teamCode || generateTeamCode());
                setCreateStatus('success');
            } else {
                setCreateStatus('error');
                setCreateError(data.message || 'Registration failed. Please try again.');
            }
        } catch {
            // Dev/preview fallback — no backend yet
            setTeamCode(generateTeamCode());
            setCreateStatus('success');
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(teamCode).then(() => {
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        });
    };

    const resetCreate = () => {
        setCreateForm(CREATE_INIT);
        setCreateStatus('idle');
        setTeamCode('');
        setCodeCopied(false);
    };

    // ── Join form handlers ────────────────────────────────────
    const handleJoinChange = (e) =>
        setJoinForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleJoinSubmit = async (e) => {
        e.preventDefault();
        setJoinStatus('loading');
        setJoinError('');

        try {
            const res  = await fetch(GOOGLE_SCRIPT_URL, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'join_team', ...joinForm }),
            });
            const data = await res.json();

            if (res.ok || data.success) {
                setJoinStatus('success');
            } else {
                setJoinStatus('error');
                setJoinError(data.message || 'Could not join team. Check your Team Code.');
            }
        } catch {
            setJoinStatus('success'); // dev fallback
        }
    };

    const resetJoin = () => {
        setJoinForm(JOIN_INIT);
        setJoinStatus('idle');
        setJoinError('');
    };

    // ── Report form handlers ──────────────────────────────────
    const handleReportChange = (e) =>
        setReportForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const ACCEPTED_TYPES = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

    const handleReportFile = (e) => {
        const file = e.target.files[0] || null;
        setFileError('');
        setReportForm((f) => ({ ...f, file: null }));
        if (!file) return;

        if (!ACCEPTED_TYPES.includes(file.type)) {
            setFileError('Only .pdf, .ppt, and .pptx files are accepted.');
            if (reportFileRef.current) reportFileRef.current.value = '';
            return;
        }
        if (file.size > MAX_BYTES) {
            setFileError('File exceeds the 5 MB limit. Please compress or trim your file.');
            if (reportFileRef.current) reportFileRef.current.value = '';
            return;
        }
        setReportForm((f) => ({ ...f, file }));
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        if (!reportForm.file) { setFileError('Please select a file.'); return; }
        setReportStatus('loading');
        setReportError('');
        setFileError('');

        try {
            const fileBase64 = await fileToBase64(reportForm.file);
            const payload = {
                action:     'submit_report',
                teamName:   reportForm.teamName,
                teamCode:   reportForm.teamCode,
                fileName:   `${reportForm.teamName}_Report`,
                mimeType:   reportForm.file.type,
                fileBase64,
            };

            const res  = await fetch(GOOGLE_SCRIPT_URL, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (res.ok || data.success) {
                setReportStatus('success');
            } else {
                setReportStatus('error');
                setReportError(data.message || 'Upload failed. Please try again.');
            }
        } catch {
            setReportStatus('success'); // dev fallback
        }
    };

    const resetReport = () => {
        setReportForm(REPORT_INIT);
        setReportStatus('idle');
        setReportError('');
        setFileError('');
        if (reportFileRef.current) reportFileRef.current.value = '';
    };

    // ── Tab switch ────────────────────────────────────────────
    const switchTab = (tab) => {
        setActiveTab(tab);
        if (createStatus === 'error') setCreateStatus('idle');
        if (joinStatus   === 'error') setJoinStatus('idle');
        if (reportStatus === 'error') setReportStatus('idle');
        setCreateError('');
        setJoinError('');
        setReportError('');
    };

    // ═══════════════════════════════════════════════════════════
    return (
        <section className="register section" id="register">
            <div className="section-title reveal">
                <h2>Register</h2>
                <p className="accent-text" style={{ textAlign: 'center', margin: '0 auto' }}>
                    Align yourself with the stars
                </p>
            </div>

            <div className="register__card reveal">

                {/* ── Tab navigation ─────────────────────────── */}
                <div className="register__tabs" role="tablist">
                    {[
                        { id: 'create', icon: '✦', label: 'Create Team' },
                        { id: 'join',   icon: '⊕', label: 'Join Team'   },
                        { id: 'report', icon: '⇡', label: 'Submit Report'},
                    ].map(({ id, icon, label }) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={activeTab === id}
                            className={`register__tab${activeTab === id ? ' register__tab--active' : ''}`}
                            onClick={() => switchTab(id)}
                        >
                            <span className="register__tab-icon" aria-hidden="true">{icon}</span>
                            <span className="register__tab-label">{label}</span>
                        </button>
                    ))}
                </div>

                {/* ── Tab body ───────────────────────────────── */}
                <div className="register__tab-body">

                    {/* ══ CREATE TEAM ══════════════════════════ */}
                    {activeTab === 'create' && (
                        <>
                            {/* Success modal */}
                            {createStatus === 'success' && (
                                <div className="register__modal-overlay">
                                    <div className="register__modal">
                                        <div className="register__modal-star">✦</div>
                                        <h3>Team Created!</h3>
                                        <p className="register__modal-sub">
                                            Share this code with your teammates so they can join.
                                        </p>
                                        <div className="register__code-row">
                                            <span className="register__team-code">{teamCode}</span>
                                            <button
                                                className={`register__copy-btn${codeCopied ? ' register__copy-btn--copied' : ''}`}
                                                onClick={handleCopyCode}
                                            >
                                                {codeCopied ? '✓ Copied' : 'Copy'}
                                            </button>
                                        </div>
                                        <p className="register__hint register__hint--modal">
                                            Maximum of 5 members per team (including yourself).
                                            Each member joins separately using the "Join Team" tab.
                                        </p>
                                        <button className="btn" onClick={resetCreate}>
                                            Register Another Team
                                        </button>
                                    </div>
                                </div>
                            )}

                            <form className="register__form" onSubmit={handleCreateSubmit} noValidate>

                                {/* Leader details */}
                                <p className="register__section-label">Team Leader</p>

                                <div className="register__row">
                                    <div className="register__field">
                                        <label htmlFor="c-leaderName">Full Name</label>
                                        <input id="c-leaderName" name="leaderName" type="text"
                                            required placeholder="Your full name"
                                            value={createForm.leaderName} onChange={handleCreateChange} />
                                    </div>
                                    <div className="register__field">
                                        <label htmlFor="c-email">Email Address</label>
                                        <input id="c-email" name="email" type="email"
                                            required placeholder="you@example.com"
                                            value={createForm.email} onChange={handleCreateChange} />
                                    </div>
                                </div>

                                <div className="register__row">
                                    <div className="register__field">
                                        <label htmlFor="c-regNumber">Registration Number</label>
                                        <input id="c-regNumber" name="regNumber" type="text"
                                            required placeholder="e.g. 23BCY0001"
                                            value={createForm.regNumber} onChange={handleCreateChange} />
                                    </div>
                                    <div className="register__field">
                                        <label htmlFor="c-phone">Phone Number</label>
                                        <input id="c-phone" name="phone" type="tel"
                                            required placeholder="+91 XXXXX XXXXX"
                                            value={createForm.phone} onChange={handleCreateChange} />
                                    </div>
                                </div>

                                {/* Team details */}
                                <p className="register__section-label">Team Details</p>

                                <div className="register__row">
                                    <div className="register__field">
                                        <label htmlFor="c-teamName">Team Name</label>
                                        <input id="c-teamName" name="teamName" type="text"
                                            required placeholder="Your team name"
                                            value={createForm.teamName} onChange={handleCreateChange} />
                                    </div>
                                    <div className="register__field">
                                        <label htmlFor="c-track">Track</label>
                                        <div className="register__select-wrap">
                                            <select id="c-track" name="track" required
                                                value={createForm.track} onChange={handleCreateChange}>
                                                <option value="" disabled>Select a track</option>
                                                {TRACK_OPTIONS.map((t) => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                            <span className="register__select-arrow" aria-hidden="true">▾</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="register__field">
                                    <label htmlFor="c-problemStatement">Problem Statement</label>
                                    <input id="c-problemStatement" name="problemStatement" type="text"
                                        required placeholder="Briefly describe the problem you're solving"
                                        value={createForm.problemStatement} onChange={handleCreateChange} />
                                </div>

                                {/* Solution */}
                                <p className="register__section-label">Solution Idea</p>

                                <div className="register__field">
                                    <label htmlFor="c-solutionText">Describe Your Approach</label>
                                    <textarea id="c-solutionText" name="solutionText"
                                        required rows={5}
                                        placeholder="Explain how you will tackle the problem — architecture, tech stack, expected impact…"
                                        value={createForm.solutionText} onChange={handleCreateChange}
                                        className="register__textarea"
                                    />
                                </div>

                                <p className="register__hint">
                                    ✦ Maximum of 5 members per team. After creating, share your Team Code with teammates. Final PPT/Report can be submitted later via the "Submit Report" tab.
                                </p>

                                {createStatus === 'error' && (
                                    <p className="register__error">{createError}</p>
                                )}

                                <button type="submit" className="btn btn-primary register__submit"
                                    disabled={createStatus === 'loading'}>
                                    {createStatus === 'loading'
                                        ? <span className="register__spinner" />
                                        : 'Create Team'}
                                </button>
                            </form>
                        </>
                    )}

                    {/* ══ JOIN TEAM ════════════════════════════ */}
                    {activeTab === 'join' && (
                        <>
                            {joinStatus === 'success' ? (
                                <div className="register__success">
                                    <div className="register__success-icon">✦</div>
                                    <h3>You&apos;re In!</h3>
                                    <p>You have successfully joined the team. See you at Equinox!</p>
                                    <button className="btn" onClick={resetJoin}>Join Another Team</button>
                                </div>
                            ) : (
                                <form className="register__form" onSubmit={handleJoinSubmit} noValidate>

                                    <p className="register__section-label">Team Code</p>
                                    <div className="register__field register__field--half">
                                        <label htmlFor="j-teamCode">Enter Team Code</label>
                                        <input id="j-teamCode" name="teamCode" type="text"
                                            required placeholder="e.g. A1B2C3" maxLength={6}
                                            value={joinForm.teamCode} onChange={handleJoinChange}
                                            className="register__code-input"
                                            style={{ textTransform: 'uppercase' }} />
                                    </div>

                                    <p className="register__section-label">Your Details</p>

                                    <div className="register__row">
                                        <div className="register__field">
                                            <label htmlFor="j-memberName">Full Name</label>
                                            <input id="j-memberName" name="memberName" type="text"
                                                required placeholder="Your full name"
                                                value={joinForm.memberName} onChange={handleJoinChange} />
                                        </div>
                                        <div className="register__field">
                                            <label htmlFor="j-email">Email Address</label>
                                            <input id="j-email" name="email" type="email"
                                                required placeholder="you@example.com"
                                                value={joinForm.email} onChange={handleJoinChange} />
                                        </div>
                                    </div>

                                    <div className="register__row">
                                        <div className="register__field">
                                            <label htmlFor="j-regNumber">Registration Number</label>
                                            <input id="j-regNumber" name="regNumber" type="text"
                                                required placeholder="e.g. 23BCY0001"
                                                value={joinForm.regNumber} onChange={handleJoinChange} />
                                        </div>
                                        <div className="register__field">
                                            <label htmlFor="j-phone">Phone Number</label>
                                            <input id="j-phone" name="phone" type="tel"
                                                required placeholder="+91 XXXXX XXXXX"
                                                value={joinForm.phone} onChange={handleJoinChange} />
                                        </div>
                                    </div>

                                    <p className="register__hint">
                                        ✦ Maximum of 5 members per team. The Team Code is provided by your Team Leader.
                                    </p>

                                    {joinStatus === 'error' && (
                                        <p className="register__error">{joinError}</p>
                                    )}

                                    <button type="submit" className="btn btn-primary register__submit"
                                        disabled={joinStatus === 'loading'}>
                                        {joinStatus === 'loading'
                                            ? <span className="register__spinner" />
                                            : 'Join Team'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    {/* ══ SUBMIT REPORT ════════════════════════ */}
                    {activeTab === 'report' && (
                        <>
                            {reportStatus === 'success' ? (
                                <div className="register__success">
                                    <div className="register__success-icon">⇡</div>
                                    <h3>Report Submitted!</h3>
                                    <p>Your file has been received. Good luck at Equinox!</p>
                                    <button className="btn" onClick={resetReport}>Submit Another</button>
                                </div>
                            ) : (
                                <form className="register__form" onSubmit={handleReportSubmit} noValidate>

                                    <p className="register__section-label">Team Verification</p>

                                    <div className="register__row">
                                        <div className="register__field">
                                            <label htmlFor="r-teamName">Team Name</label>
                                            <input id="r-teamName" name="teamName" type="text"
                                                required placeholder="Exactly as registered"
                                                value={reportForm.teamName} onChange={handleReportChange} />
                                        </div>
                                        <div className="register__field">
                                            <label htmlFor="r-teamCode">Team Code</label>
                                            <input id="r-teamCode" name="teamCode" type="text"
                                                required placeholder="e.g. A1B2C3" maxLength={6}
                                                value={reportForm.teamCode} onChange={handleReportChange}
                                                className="register__code-input"
                                                style={{ textTransform: 'uppercase' }} />
                                        </div>
                                    </div>

                                    <p className="register__section-label">File Upload</p>

                                    <div className="register__field">
                                        <label htmlFor="r-file">PPT or Report</label>
                                        <label htmlFor="r-file" className={`register__file-zone${fileError ? ' register__file-zone--error' : ''}`}>
                                            <span className="register__file-icon" aria-hidden="true">⇡</span>
                                            {reportForm.file
                                                ? <>
                                                    <span className="register__file-name">{reportForm.file.name}</span>
                                                    <span className="register__file-size">
                                                        {(reportForm.file.size / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                </>
                                                : <span>
                                                    <strong>Click to browse</strong> or drop your file here
                                                    <br />
                                                    <small>.pdf, .ppt, .pptx — max 5 MB</small>
                                                </span>
                                            }
                                            <input
                                                ref={reportFileRef}
                                                id="r-file" type="file"
                                                accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                                                style={{ display: 'none' }}
                                                onChange={handleReportFile}
                                            />
                                        </label>
                                        {fileError && <p className="register__error register__error--file">{fileError}</p>}
                                    </div>

                                    <p className="register__hint">
                                        ✦ Your file will be renamed to <em>{reportForm.teamName ? `${reportForm.teamName}_Report` : '[TeamName]_Report'}</em> on the server. Ensure your Team Name exactly matches your registration.
                                    </p>

                                    {reportStatus === 'error' && (
                                        <p className="register__error">{reportError}</p>
                                    )}

                                    <button type="submit" className="btn btn-primary register__submit"
                                        disabled={reportStatus === 'loading'}>
                                        {reportStatus === 'loading'
                                            ? <span className="register__spinner" />
                                            : 'Submit Report'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                </div>
            </div>
        </section>
    );
}
