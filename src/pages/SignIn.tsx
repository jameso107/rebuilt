import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './SignIn.css';

export default function SignIn() {
  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const { setUser } = useApp();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const first = firstName.trim();
    const last = lastInitial.trim().slice(0, 1).toUpperCase();
    if (!first) return;
    const user = { firstName: first, lastInitial: last || '' };
    setUser(user);
    localStorage.setItem('rebuilt_user', JSON.stringify(user));
    navigate('/match-setup');
  };

  return (
    <div className="sign-in">
      <div className="sign-in-card">
        <h1>Rebuilt Scouting</h1>
        <p className="subtitle">FIRST Robotics Team Scouting App</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Alex"
              required
              autoComplete="given-name"
            />
          </div>
          <div className="input-group">
            <label htmlFor="lastInitial">Last Initial</label>
            <input
              id="lastInitial"
              type="text"
              value={lastInitial}
              onChange={(e) => setLastInitial(e.target.value.slice(0, 1))}
              placeholder="e.g. J"
              maxLength={1}
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn-primary">
            Start Scouting
          </button>
        </form>
      </div>
    </div>
  );
}
