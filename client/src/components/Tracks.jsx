import { Heart, Route, Users, Shield, Home, Sparkles } from "lucide-react";
import './Tracks.css';

const TRACKS = [
    {
        name: 'SMART HEALTHCARE SYSTEMS',
        subtitle: 'Intelligent Care Infrastructure',
        icon: <Heart size={30} strokeWidth={2} />,
        description: 'Illuminate the path to better health. Design solutions that empower care, predict outcomes, and save lives.',
    },
    {
        name: 'ROAD SAFETY',
        subtitle: 'Intelligent Mobility & Road Safety',
        icon: <Route size={30} strokeWidth={2} />,
        description: 'Drive the future of safe mobility. Create solutions that protect lives, prevent accidents, and pave the way for smarter roads.',
    },
    {
        name: 'SOCIAL WELLNESS',
        subtitle: 'Smart Communities & Public Wellness',
        icon: <Users size={30} strokeWidth={2} />,
        description: 'Foster thriving communities. Build solutions that enhance public services, promote well-being, and create smarter cities for all.',
    },
    {
        name: 'SMART SECURITY',
        subtitle: 'Defending Smart Infrastructure',
        icon: <Shield size={30} strokeWidth={2} />,
        description: 'Guard the digital frontier. Develop solutions that secure smart infrastructure, protect data, and ensure a safe connected future.',
    },
    {
        name: 'SMART HOME & AUTOMATION',
        subtitle: 'Next-Gen Smart Living',
        icon: <Home size={30} strokeWidth={2} />,
        description: 'Reimagine home life. Create solutions that automate daily tasks, enhance comfort, and make smart living accessible to everyone.',
    },
    {
        name: 'OPEN INNOVATION: SMART INFRASTRUCTURE',
        subtitle: 'Build Beyond Boundaries',
        icon: <Sparkles size={30} strokeWidth={2} />,
        description: 'Unleash the power of open innovation. Create solutions that transcend traditional boundaries and build the next generation of smart infrastructure.',
    },
];

export default function Tracks() {
    return (
        <section className="tracks section" id="tracks">
            {/* Background Constellation Map */}
            <div className="tracks__bg-vector">
                <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 150 L250 80 L350 200 L550 120 L700 250 L600 450 L400 350 L200 400 Z" stroke="var(--gold-line)" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.4" />
                    <path d="M250 80 L400 350 M350 200 L700 250 M100 150 L200 400" stroke="var(--gold-line)" strokeWidth="0.5" opacity="0.2" />
                    <circle cx="100" cy="150" r="3" fill="var(--marble)" opacity="0.6" />
                    <circle cx="250" cy="80" r="4" fill="var(--mist)" opacity="0.8" />
                    <circle cx="350" cy="200" r="2" fill="var(--marble)" opacity="0.5" />
                    <circle cx="550" cy="120" r="5" fill="var(--gold-subtle)" opacity="0.7" />
                    <circle cx="700" cy="250" r="3" fill="var(--marble)" opacity="0.6" />
                    <circle cx="600" cy="450" r="4" fill="var(--mist)" opacity="0.8" />
                    <circle cx="400" cy="350" r="3" fill="var(--gold-subtle)" opacity="0.6" />
                    <circle cx="200" cy="400" r="2" fill="var(--marble)" opacity="0.5" />
                </svg>
            </div>

            <div className="section-title reveal">
                <h2>Tracks</h2>
                <p className="accent-text" style={{ textAlign: 'center', margin: '0 auto' }}>
                    Choose your constellation
                </p>
            </div>

            <div className="tracks__grid reveal stagger">
                {TRACKS.map((track) => (
                    <div className="tracks__card" key={track.name}>
                        <span className="tracks__icon">{track.icon}</span>
                        <h3 className="tracks__name">{track.name}</h3>
                        <span className="tracks__subtitle accent-text">{track.subtitle}</span>
                        <p className="tracks__desc">{track.description}</p>
                        <div className="tracks__line" />
                    </div>
                ))}
            </div>
        </section>
    );
}
