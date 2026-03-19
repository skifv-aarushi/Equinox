import { useState, useEffect } from 'react';
import './Navbar.css';

const NAV_LINKS = [
    { label: 'About', href: '#about' },
    { label: 'Sponsors', href: '#sponsors' },
    { label: 'Timeline', href: '#timeline' },
    { label: 'Tracks', href: '#tracks' },
    { label: 'Register', href: '#register' },
    { label: 'FAQ', href: '#faq' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleClick = (e, href) => {
        e.preventDefault();
        setMenuOpen(false);
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`} id="navbar">
            <div className="navbar__inner">
                <a href="#" className="navbar__logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <span className="navbar__logo-icon">☉</span>
                    <span className="navbar__logo-text">Equinox</span>
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
                </ul>
            </div>
        </nav>
    );
}
