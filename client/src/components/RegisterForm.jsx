import { useNavigate } from 'react-router-dom';
import './RegisterForm.css';

export default function RegisterForm() {
    const navigate = useNavigate();

    return (
        <section className="register section" id="register">
            <div className="section-title reveal">
                <h2>Register</h2>
                <p className="section-eyebrow">Align yourself with the stars</p>
            </div>

            <div className="reveal" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <button 
                    className="btn btn-primary register__live-btn" 
                    onClick={() => navigate('/register')}
                    style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}
                >
                    Registrations Are Live
                </button>
            </div>
        </section>
    );
}
