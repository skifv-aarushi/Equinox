import { useNavigate } from 'react-router-dom';
import './RegisterForm.css';

export default function RegisterForm() {
    const navigate = useNavigate();

    return (
        <section className="register section" id="register">
            <div className="section-title reveal">
                <h2>Register</h2>
                <p className="accent-text" style={{ textAlign: 'center', margin: '0 auto' }}>
                    Align yourself with the stars
                </p>
            </div>

            <div className="reveal" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <button 
                    className="btn btn-primary" 
                    onClick={() => navigate('/register')}
                    style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}
                >
                    Register Now
                </button>
            </div>
        </section>
    );
}
