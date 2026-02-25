import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { submitScoutData } from '../lib/db';
import type { AllianceScoutData } from '../lib/db';
import './AllianceScout.css';

const CATEGORIES = ['accuracy', 'volume', 'defense', 'awareness', 'speed', 'autonomous'] as const;

type Category = (typeof CATEGORIES)[number];

function reorder(
  current: [string, string, string],
  fromIdx: number,
  toIdx: number
): [string, string, string] {
  const arr = [...current];
  const [removed] = arr.splice(fromIdx, 1);
  arr.splice(toIdx, 0, removed);
  return arr as [string, string, string];
}

export default function AllianceScout() {
  const { user, matchSetup, setMatchSetup } = useApp();
  const navigate = useNavigate();

  if (!matchSetup || matchSetup.watchMode !== 'alliance' || !matchSetup.alliance) {
    navigate('/match-setup');
    return null;
  }

  const robots = matchSetup.alliance === 'red'
    ? matchSetup.redRobots
    : matchSetup.blueRobots;

  const [rankings, setRankings] = useState<Record<Category, [string, string, string]>>(() => {
    const init: Record<string, [string, string, string]> = {};
    for (const c of CATEGORIES) {
      init[c] = [...robots];
    }
    return init as Record<Category, [string, string, string]>;
  });
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleMove = (category: Category, fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= 3) return;
    setRankings((prev) => ({
      ...prev,
      [category]: reorder(prev[category], fromIdx, toIdx),
    }));
  };

  const handleEndMatch = async () => {
    setSubmitting(true);
    const data: AllianceScoutData = {
      type: 'alliance',
      matchSetup,
      scorerName: `${user?.firstName || ''} ${user?.lastInitial || ''}`.trim(),
      rankings,
      comments,
      timestamp: new Date().toISOString(),
    };
    await submitScoutData(data);
    setMatchSetup(null);
    setSubmitting(false);
    navigate('/match-setup');
  };

  const allianceColor = matchSetup.alliance === 'red' ? '#ff6b6b' : '#4dabf7';

  return (
    <div className="alliance-scout">
      <header>
        <h1>{matchSetup.alliance === 'red' ? 'Red' : 'Blue'} Alliance</h1>
        <p className="robots">
          {robots.map((r) => (
            <span key={r} className="robot-badge" style={{ borderColor: allianceColor }}>
              {r}
            </span>
          ))}
        </p>
      </header>

      <div className="categories">
        {CATEGORIES.map((cat) => (
          <div key={cat} className="category-card">
            <h3>{cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
            <p className="hint">Best → Worst (tap arrows to reorder)</p>
            <div className="ranking-list">
              {rankings[cat].map((robot, idx) => (
                <div key={`${cat}-${robot}-${idx}`} className="rank-row">
                  <span className="rank-num">{idx + 1}</span>
                  <span className="robot-num">{robot}</span>
                  <div className="arrows">
                    <button
                      type="button"
                      onClick={() => handleMove(cat, idx, 'up')}
                      disabled={idx === 0}
                      aria-label="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(cat, idx, 'down')}
                      disabled={idx === 2}
                      aria-label="Move down"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="comments-section">
        <label htmlFor="comments">Comments</label>
        <textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Notes about this match..."
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
