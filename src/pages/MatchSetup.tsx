import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { MatchSetup } from '../lib/db';
import './MatchSetup.css';

const ROBOT_REGEX = /^\d{1,5}$/;

function validateRobot(num: string): boolean {
  return num === '' || ROBOT_REGEX.test(num);
}

function allRobotsValid(red: string[], blue: string[]): boolean {
  const all = [...red, ...blue];
  return all.every((r) => r.length > 0 && ROBOT_REGEX.test(r));
}

export default function MatchSetup() {
  const { user, setUser, setMatchSetup } = useApp();
  const navigate = useNavigate();

  const [red1, setRed1] = useState('');
  const [red2, setRed2] = useState('');
  const [red3, setRed3] = useState('');
  const [blue1, setBlue1] = useState('');
  const [blue2, setBlue2] = useState('');
  const [blue3, setBlue3] = useState('');

  const [watchMode, setWatchMode] = useState<'alliance' | 'robot'>('alliance');
  const [alliance, setAlliance] = useState<'red' | 'blue'>('red');
  const [selectedRobot, setSelectedRobot] = useState('');

  const redRobots = [red1, red2, red3];
  const blueRobots = [blue1, blue2, blue3];
  const allRobots = [...redRobots, ...blueRobots].filter(Boolean);

  const handleBegin = () => {
    if (!allRobotsValid(redRobots, blueRobots)) return;
    if (watchMode === 'robot' && !selectedRobot) return;

    const setup: MatchSetup = {
      redRobots: [red1, red2, red3],
      blueRobots: [blue1, blue2, blue3],
      watchMode,
      ...(watchMode === 'alliance' ? { alliance } : { robotNumber: selectedRobot }),
    };
    setMatchSetup(setup);

    if (watchMode === 'alliance') {
      navigate('/scout-alliance');
    } else {
      navigate('/scout-robot');
    }
  };

  const canBegin =
    allRobotsValid(redRobots, blueRobots) &&
    (watchMode === 'alliance' || (watchMode === 'robot' && selectedRobot));

  return (
    <div className="match-setup">
      <header>
        <h1>Match Setup</h1>
        <p className="scorer">
          Scoring as: {user?.firstName} {user?.lastInitial}.
          <button
            type="button"
            className="btn-signout"
            onClick={() => {
              setUser(null);
              localStorage.removeItem('rebuilt_user');
              navigate('/', { replace: true });
            }}
          >
            Sign out
          </button>
        </p>
      </header>

      <section className="alliances">
        <div className="alliance red">
          <h2>Red Alliance</h2>
          {[red1, red2, red3].map((val, i) => (
            <input
              key={`r${i}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={`Robot ${i + 1}`}
              value={val}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 5);
                [setRed1, setRed2, setRed3][i](v);
              }}
              className={!validateRobot(val) ? 'invalid' : ''}
            />
          ))}
        </div>
        <div className="alliance blue">
          <h2>Blue Alliance</h2>
          {[blue1, blue2, blue3].map((val, i) => (
            <input
              key={`b${i}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={`Robot ${i + 1}`}
              value={val}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 5);
                [setBlue1, setBlue2, setBlue3][i](v);
              }}
              className={!validateRobot(val) ? 'invalid' : ''}
            />
          ))}
        </div>
      </section>

      <section className="watch-mode">
        <h2>What are you watching?</h2>
        <div className="mode-options">
          <label className="radio-card">
            <input
              type="radio"
              name="watch"
              checked={watchMode === 'alliance'}
              onChange={() => setWatchMode('alliance')}
            />
            <span>I'm watching a whole alliance</span>
          </label>
          <label className="radio-card">
            <input
              type="radio"
              name="watch"
              checked={watchMode === 'robot'}
              onChange={() => setWatchMode('robot')}
            />
            <span>I'm watching a specific robot</span>
          </label>
        </div>

        {watchMode === 'alliance' && (
          <div className="alliance-select">
            <label>
              <input
                type="radio"
                name="alliance"
                checked={alliance === 'red'}
                onChange={() => setAlliance('red')}
              />
              Red
            </label>
            <label>
              <input
                type="radio"
                name="alliance"
                checked={alliance === 'blue'}
                onChange={() => setAlliance('blue')}
              />
              Blue
            </label>
          </div>
        )}

        {watchMode === 'robot' && allRobots.length > 0 && (
          <div className="robot-select">
            <label htmlFor="robot">Select robot</label>
            <select
              id="robot"
              value={selectedRobot}
              onChange={(e) => setSelectedRobot(e.target.value)}
            >
              <option value="">Choose a robot</option>
              {redRobots.filter(Boolean).map((r) => (
                <option key={`r-${r}`} value={r}>
                  Red {r}
                </option>
              ))}
              {blueRobots.filter(Boolean).map((r) => (
                <option key={`b-${r}`} value={r}>
                  Blue {r}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <button
        className="btn-begin"
        onClick={handleBegin}
        disabled={!canBegin}
      >
        Begin Match
      </button>
    </div>
  );
}
