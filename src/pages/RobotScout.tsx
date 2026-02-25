import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { submitScoutData } from '../lib/db';
import type { RobotScoutData } from '../lib/db';
import './RobotScout.css';

export default function RobotScout() {
  const { user, matchSetup, setMatchSetup } = useApp();
  const navigate = useNavigate();

  if (!matchSetup || matchSetup.watchMode !== 'robot' || !matchSetup.robotNumber) {
    navigate('/match-setup');
    return null;
  }

  const [crossBump, setCrossBump] = useState(0);
  const [crossTunnel, setCrossTunnel] = useState(0);
  const [passingCycles, setPassingCycles] = useState(0);
  const [scoringCycleCount, setScoringCycleCount] = useState(0);
  const [shootingSessions, setShootingSessions] = useState<{ startTime: number; endTime: number }[]>([]);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const holdStartRef = useRef<number | null>(null);
  const cycleCountAtStartRef = useRef(0);

  const handleHoldStart = useCallback(() => {
    holdStartRef.current = Date.now();
    cycleCountAtStartRef.current = scoringCycleCount;
  }, [scoringCycleCount]);

  const handleHoldEnd = useCallback(() => {
    if (holdStartRef.current === null) return;
    const endTime = Date.now();
    const startTime = holdStartRef.current;
    setShootingSessions((prev) => [...prev, { startTime, endTime }]);
    setScoringCycleCount((prev) => prev + 1);
    holdStartRef.current = null;
  }, []);

  const avgCycleTimeMs =
    shootingSessions.length > 0
      ? shootingSessions.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) /
        shootingSessions.length
      : null;

  const handleEndMatch = async () => {
    setSubmitting(true);
    const data: RobotScoutData = {
      type: 'robot',
      matchSetup,
      scorerName: `${user?.firstName || ''} ${user?.lastInitial || ''}`.trim(),
      crossBump,
      crossTunnel,
      passingCycles,
      shootingSessions,
      scoringCycleCount,
      averageCycleTimeMs: avgCycleTimeMs,
      comments,
      timestamp: new Date().toISOString(),
    };
    await submitScoutData(data);
    setMatchSetup(null);
    setSubmitting(false);
    navigate('/match-setup');
  };


  return (
    <div className="robot-scout">
      <header>
        <h1>Robot {matchSetup.robotNumber}</h1>
      </header>

      <div className="tickers">
        <div className="ticker-row">
          <span className="label">Cross Bump</span>
          <div className="controls">
            <button type="button" onClick={() => setCrossBump((c) => Math.max(0, c - 1))}>
              −
            </button>
            <span className="value">{crossBump}</span>
            <button type="button" onClick={() => setCrossBump((c) => c + 1)}>
              +
            </button>
          </div>
        </div>
        <div className="ticker-row">
          <span className="label">Cross Tunnel</span>
          <div className="controls">
            <button type="button" onClick={() => setCrossTunnel((c) => Math.max(0, c - 1))}>
              −
            </button>
            <span className="value">{crossTunnel}</span>
            <button type="button" onClick={() => setCrossTunnel((c) => c + 1)}>
              +
            </button>
          </div>
        </div>
        <div className="ticker-row">
          <span className="label">Passing Cycles</span>
          <div className="controls">
            <button type="button" onClick={() => setPassingCycles((c) => Math.max(0, c - 1))}>
              −
            </button>
            <span className="value">{passingCycles}</span>
            <button type="button" onClick={() => setPassingCycles((c) => c + 1)}>
              +
            </button>
          </div>
        </div>
      </div>

      <div className="shoot-section">
        <h3>Shooting</h3>
        <p className="hint">Press and hold while shooting to record time & cycle</p>
        <button
          className="btn-hold"
          onTouchStart={(e) => {
            e.preventDefault();
            handleHoldStart();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleHoldEnd();
          }}
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
        >
          Hold to Record Shot
        </button>
        <div className="shoot-stats">
          <span>Scoring cycles: {scoringCycleCount}</span>
          {avgCycleTimeMs !== null && (
            <span>Avg cycle: {(avgCycleTimeMs / 1000).toFixed(1)}s</span>
          )}
        </div>
      </div>

      <div className="comments-section">
        <label htmlFor="comments">Comments</label>
        <textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Notes about this robot..."
          rows={3}
        />
      </div>

      <button
        className="btn-end"
        onClick={handleEndMatch}
        disabled={submitting}
      >
        {submitting ? 'Saving...' : 'End Match'}
      </button>
    </div>
  );
}
