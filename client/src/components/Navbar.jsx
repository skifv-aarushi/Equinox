import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { createApiClient, fetchTeamByEmail } from '../utils/api';
import './Navbar.css';

const NAV_LINKS = [
    { label: 'About',    href: '#about'    },
    { label: 'Sponsor',  href: '#sponsors' },
    { label: 'Timeline', href: '#timeline' },
    { label: 'Tracks',   href: '#tracks'   },
    { label: 'Register', href: '#register' },
    { label: 'FAQs',      href: '#faq'      },
];

export default function Navbar() {
    const [scrolled,  setScrolled]  = useState(false);
    const [atHero,    setAtHero]    = useState(true);
    const [menuOpen,  setMenuOpen]  = useState(false);

    // Clerk user state
    const { user, isLoaded: userLoaded } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();

    // Team status: null = no team / no auth, 'loading', or team object
    const [teamStatus, setTeamStatus] = useState(null);

    // Fetch team status once user is loaded
    useEffect(() => {
        if (!userLoaded) return;
        if (!user) { setTeamStatus(null); return; }

        const email = user.primaryEmailAddress?.emailAddress;
        if (!email) { setTeamStatus(null); return; }

        const api = createApiClient(getToken);
        fetchTeamByEmail(api, email)
            .then(data => setTeamStatus(data ?? null))
            .catch(() => setTeamStatus(null));
    }, [userLoaded, user, getToken]);

    const hasTeam  = teamStatus && teamStatus.teamName;
    const isSignedIn = userLoaded && !!user;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const hero = document.getElementById('hero');
        if (!hero) return;
        const observer = new IntersectionObserver(
            ([entry]) => setAtHero(entry.isIntersecting),
            { threshold: 0.1 }
        );
        observer.observe(hero);
        return () => observer.disconnect();
    }, []);

    const handleClick = (e, href) => {
        e.preventDefault();
        setMenuOpen(false);
        const el = document.querySelector(href);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = '/' + href;
        }
    };

    const handleMyTeam = (e) => {
        e.preventDefault();
        setMenuOpen(false);
        navigate('/register');
    };

    return (
        <nav className={`navbar${atHero ? ' navbar--hero' : scrolled ? ' navbar--scrolled' : ''}`} id="navbar">
            <div className="navbar__inner">
                <a href="#" className="navbar__logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <img src="/equinox-logo.png" alt="" className="navbar__logo-icon-img" draggable={false} />
                    <img src="/equinoxnav.png" alt="Equinox" className="navbar__logo-text-img" draggable={false} />
                </a>

                <button
                    className={`navbar__toggle${menuOpen ? ' open' : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    <span /><span /><span />
                </button>

                <ul className={`navbar__links${menuOpen ? ' navbar__links--open' : ''}`}>
                    {NAV_LINKS.map(({ label, href }) => (
                        <li key={href}>
                            <a href={href} onClick={(e) => handleClick(e, href)}>
                                {label}
                            </a>
                        </li>
                    ))}

                    {/* My Team tab — visible only when signed in */}
                    {isSignedIn && (
                        <li>
                            <a href="/register" onClick={handleMyTeam}>
                                Team
                            </a>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
}
