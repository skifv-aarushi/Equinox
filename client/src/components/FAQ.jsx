import { useState } from 'react';
import './FAQ.css';

const QUESTIONS = [
    {
        q: 'What is Equinox?',
        a: 'Equinox ’26 is a 60-hour hackathon centered on the theme of Smart Infrastructure, challenging teams to build solutions for smarter cities, homes, roads, and communities. Organized by RoboVITics at VIT Vellore, presented by Anchor by Panasonic, it brings together students to innovate, build, and solve real-world problems.',
    },
    {
        q: 'Who can participate?',
        a: 'Equinox is open to VIT students from any discipline, with team participation limited to 3–5 members. Solo participants are also welcome and can find teammates during the event.',
    },
    {
        q: 'Is there a registration fee?',
        a: 'It’s absolutely free! Just bring your ideas, energy, and creativity, and you’re all set to participate.',
    },
    {
        q: 'What should I bring?',
        a: 'Bring your laptop and charger. We’ll provide Wi-Fi, workspace, and the environment you need to innovate.',
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
        q: 'What do I do if an electric component I need isn\'t listed or not available?',
        a: 'If a component isn\'t listed or available, you need to bring it yourself or find an alternative solution. We encourage creativity and resourcefulness, so think outside the box and make the most of what\'s available!',
    },
    {
        q: 'What happens if I damage any equipment provided by the organizers?',
        a: 'Participants are responsible for any damage to the provided equipment. Please handle all materials with care to ensure a safe and enjoyable experience for everyone.',  
    },
    {
        q: 'Will there be prizes?',
        a: 'Yes! An exciting prize pool of ₹2L+ will be awarded across all tracks.',
    },
    {
        q: 'If I have more questions, how can I reach out?',
        a: 'Feel free to reach out to us at robovitics@vit.ac.in',
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
                <h2>Frequently Asked</h2>
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
