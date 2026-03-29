import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="celestial-divider" />

            <div className="footer__content">
                {/* Greek meander border */}
                <div className="footer__meander" />

                <div className="footer__inner">
                    <div className="footer__brand">
                        <span className="footer__logo-icon">☉</span>
                        <span className="footer__logo-text">Equinox</span>
                        <p className="footer__tagline">
                            Override the Ordinary.
                        </p>
                    </div>

                    <div className="footer__links">
                        <div className="footer__col">
                            <h4 className="footer__col-title">Navigate</h4>
                            <a href="#about">About</a>
                            <a href="#tracks">Tracks</a>
                            <a href="#timeline">Timeline</a>
                            <a href="#register">Register</a>
                        </div>
                        <div className="footer__col">
                            <h4 className="footer__col-title">Connect</h4>
                            <a href="https://www.instagram.com/robovitics/" target="_blank"  rel="noopener">Instagram</a>
                            <a href="https://x.com/RoboVITics_HQ" target="_blank" rel="noopener">X</a>
                            <a href="https://medium.com/@roboviticsvitvellore" target="_blank" rel="noopener">Medium</a>
                            <a href="https://www.linkedin.com/company/robovitics/posts/?feedView=all" target="_blank" rel="noopener">LinkedIn</a>
                        </div>
                    </div>
                </div>

                <div className="footer__bottom">
                    <p>© 2026 Equinox by RoboVITics. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
