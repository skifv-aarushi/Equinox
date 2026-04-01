import { useState } from 'react';
import './FAQ.css';

const QUESTIONS = [
    {
        q: 'What is Equinox?',
        a: 'Equinox ’26 is a 60-hour hackathon centered on the theme of Smart Infrastructure, challenging teams to build solutions for smarter cities, homes, roads, and communities. Organized by RoboVITics at VIT Vellore and presented by Anchor by Panasonic, it brings together students to innovate, build, and solve real-world problems.',
    },
    {
        q: 'Who can participate?',
        a: 'Equinox is open to VIT students from any discipline, with team participation limited to 3–5 members. Solo participants are also welcome and can find teammates during the event.',
    },
    {
        q: 'Is there a registration fee?',
        a: 'No, There isn\'t any fee for registration. It’s absolutely free! Just bring your ideas, energy, and creativity, and you’re all set to participate.',
    },
    {
        q: 'What should I bring to the Hackathon?',
        a: 'Bring your laptop, charger and ideas! We’ll provide Wi-Fi, workspace, and the environment you need to innovate.',
    },
    {
        q: 'Can I work on a pre-existing project?',
        a: 'No. All projects must be started from scratch during the hackathon. You may come with ideas and research, but no pre-written code is allowed. The celestial clock starts fair for everyone.',
    },
    {
        q: 'How will projects be judged?',
        a: 'Projects will be evaluated on innovation, technical complexity, design quality, real-world impact, and presentation. Our panel of expert judges will assess each submission with care.',
    },
    {
        q: 'Will there be prizes?',
        a: 'Yes! An exciting prize pool of ₹2L+ will be awarded across all tracks.',
    },
    {
        q: 'If I have more questions, how can I reach out?',
        a: 'Feel free to reach out to us at robovitics@vit.ac.in and our instagram handle as well',
    },
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);

    const toggle = (i) => {
        setOpenIndex(openIndex === i ? null : i);
    };

    return (
        <section className="faq section" id="faq">
            <div className="section-title reveal">
                <h2>Frequently Asked Questions</h2>
                <p className="section-eyebrow">Seek and you shall find</p>
            </div>

            <div className="faq__list reveal">
                {QUESTIONS.map((item, i) => (
                    <div
                        className={`faq__item${openIndex === i ? ' faq__item--open' : ''}`}
                        key={i}
                    >
                        <button className="faq__question" onClick={() => toggle(i)}>
                            <span>{item.q}</span>
                            <span className="faq__icon">{openIndex === i ? '−' : '+'}</span>
                        </button>
                        <div className="faq__answer">
                            <p>{item.a}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
