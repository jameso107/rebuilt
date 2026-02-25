import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const { user, setUser, setMatchSetup, eventInfo } = useApp();
  const navigate = useNavigate();

  const [matchNumber, setMatchNumber] = useState('');
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

  const eventTeams = eventInfo?.teamNumbers ?? [];
  const restrictToEvent = eventTeams.length > 0;

  const handleBegin = () => {
    if (!allRobotsValid(redRobots, blueRobots)) return;
    if (watchMode === 'robot' && !selectedRobot) return;
    if (restrictToEvent) {
      const invalid = allRobots.some((r) => !eventTeams.includes(r));
      if (invalid) return;
    }

    const setup: MatchSetup = {
      redRobots: [red1, red2, red3],
      blueRobots: [blue1, blue2, blue3],
      watchMode,
      ...(watchMode === 'alliance' ? { alliance } : { robotNumber: selectedRobot }),
      ...(matchNumber.trim() && { matchNumber: matchNumber.trim() }),
      ...(eventInfo && { eventKey: eventInfo.key }),
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
    (watchMode === 'alliance' || (watchMode === 'robot' && selectedRobot)) &&
    (!restrictToEvent || allRobots.every((r) => eventTeams.includes(r)));

  const RobotInput = ({
    value,
    onChange,
    placeholder,
    className,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    className?: string;
  }) =>
    restrictToEvent ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      >
        <option value="">Select team</option>
        {eventTeams.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    ) : (
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 5);
          onChange(v);
        }}
        className={className}
      />
    );

  return (
    <div className="match-setup">
      <header>
        <h1>Match Setup</h1>
        {eventInfo && (
          <p className="event-badge">Event: {eventInfo.name}</p>
        )}
        <p className="scorer">
          Scoring as: {user?.firstName} {user?.lastInitial}.
          <Link to="/admin" className="admin-link">Admin</Link>
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

      <section className="match-number">
        <label htmlFor="matchNum">Match number</label>
        <input
          id="matchNum"
          type="text"
          value={matchNumber}
          onChange={(e) => setMatchNumber(e.target.value.toUpperCase())}
          placeholder="e.g. Q12"
        />
      </section>

      <section className="alliances">
        <div className="alliance red">
          <h2>Red Alliance</h2>
          {[red1, red2, red3].map((val, i) => (
            <RobotInput
              key={`r${i}`}
              value={val}
              onChange={[setRed1, setRed2, setRed3][i]}
              placeholder={`Robot ${i + 1}`}
              className={!validateRobot(val) ? 'invalid' : ''}
            />
          ))}
        </div>
        <div className="alliance blue">
          <h2>Blue Alliance</h2>
          {[blue1, blue2, blue3].map((val, i) => (
            <RobotInput
              key={`b${i}`}
              value={val}
              onChange={[setBlue1, setBlue2, setBlue3][i]}
              placeholder={`Robot ${i + 1}`}
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
