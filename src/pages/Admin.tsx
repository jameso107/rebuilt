import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { getAllScoutData, clearAllScoutData, type ScoutDataRow, type AllianceScoutData, type RobotScoutData } from '../lib/db';
import { useApp } from '../context/AppContext';
import { fetchMichiganEvents, fetchEventTeams } from '../lib/tba';
import type { TBAEvent } from '../lib/tba';
import TeamFocusTab from '../components/TeamFocusTab';
import './Admin.css';

const ADMIN_PASSWORD = '107107';

type Tab = 'overview' | 'rankings' | 'teams' | 'raw';

interface TeamStats {
  team: string;
  allianceRankPoints: number;
  allianceScouts: number;
  robotScouts: number;
  crossBump: number;
  crossTunnel: number;
  passingCycles: number;
  scoringCycles: number;
  avgCycleTimeMs: number | null;
  cycleTimeSamples: number[];
  categories: Record<string, number>; // rank points per category
}

function computeRankings(rows: ScoutDataRow[]): Map<string, TeamStats> {
  const teams = new Map<string, TeamStats>();

  const getOrCreate = (team: string): TeamStats => {
    if (!teams.has(team)) {
      teams.set(team, {
        team,
        allianceRankPoints: 0,
        allianceScouts: 0,
        robotScouts: 0,
        crossBump: 0,
        crossTunnel: 0,
        passingCycles: 0,
        scoringCycles: 0,
        avgCycleTimeMs: null,
        cycleTimeSamples: [],
        categories: {},
      });
    }
    return teams.get(team)!;
  };

  for (const { data } of rows) {
    if (data.type === 'alliance') {
      const d = data as AllianceScoutData;
      const robots = d.matchSetup.alliance === 'red' ? d.matchSetup.redRobots : d.matchSetup.blueRobots;
      for (const robot of robots) {
        getOrCreate(robot).allianceScouts += 1;
      }
      const cats = ['accuracy', 'volume', 'defense', 'awareness', 'speed', 'autonomous'];
      for (const cat of cats) {
        const ranking = d.rankings[cat as keyof typeof d.rankings];
        if (ranking) {
          ranking.forEach((robot, idx) => {
            const pts = 3 - idx;
            const t = getOrCreate(robot);
            t.allianceRankPoints += pts;
            t.categories[cat] = (t.categories[cat] || 0) + pts;
          });
        }
      }
    } else {
      const d = data as RobotScoutData;
      const robot = d.matchSetup.robotNumber!;
      const t = getOrCreate(robot);
      t.robotScouts += 1;
      t.crossBump += d.crossBump;
      t.crossTunnel += d.crossTunnel;
      t.passingCycles += d.passingCycles;
      t.scoringCycles += d.scoringCycleCount;
      if (d.averageCycleTimeMs != null) {
        t.cycleTimeSamples.push(d.averageCycleTimeMs);
      }
    }
  }

  for (const t of teams.values()) {
    if (t.cycleTimeSamples.length > 0) {
      t.avgCycleTimeMs = t.cycleTimeSamples.reduce((a, b) => a + b, 0) / t.cycleTimeSamples.length;
    }
  }
  return teams;
}

export default function Admin() {
  const { eventInfo, setEventInfo } = useApp();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [data, setData] = useState<ScoutDataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [beginEventModal, setBeginEventModal] = useState(false);
  const [endEventModal, setEndEventModal] = useState(false);
  const [endEventConfirm, setEndEventConfirm] = useState('');
  const [michiganEvents, setMichiganEvents] = useState<TBAEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated) {
      setLoading(true);
      getAllScoutData()
        .then(setData)
        .finally(() => setLoading(false));
    }
  }, [authenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setPassword('');
  };

  const openBeginEvent = () => {
    setBeginEventModal(true);
    setEventsError(null);
    setEventsLoading(true);
    fetchMichiganEvents()
      .then(setMichiganEvents)
      .catch((e) => setEventsError(String(e)))
      .finally(() => setEventsLoading(false));
  };

  const selectEvent = async (event: TBAEvent) => {
    try {
      await clearAllScoutData();
      const teams = await fetchEventTeams(event.key);
      const teamNumbers = teams.map((t) => String(t.team_number));
      await setEventInfo({ key: event.key, name: event.name, teamNumbers });
      setData([]);
      setBeginEventModal(false);
    } catch (e) {
      setEventsError(String(e));
    }
  };

  const openEndEvent = () => {
    setEndEventModal(true);
    setEndEventConfirm('');
  };

  const confirmEndEvent = async () => {
    if (endEventConfirm !== 'CONFIRM') return;
    try {
      await clearAllScoutData();
      await setEventInfo(null);
      setData([]);
      setEndEventModal(false);
      setEndEventConfirm('');
    } catch (e) {
      setEventsError(String(e));
    }
  };

  if (!authenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <h1>Admin</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
            />
            {error && <p className="error">{error}</p>}
            <button type="submit">Enter</button>
          </form>
          <button type="button" className="back-link" onClick={() => navigate('/match-setup')}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const allianceData = data.filter((r) => r.data.type === 'alliance');
  const robotData = data.filter((r) => r.data.type === 'robot');
  const teamStatsMap = computeRankings(data);
  const teamStats = Array.from(teamStatsMap.values()).sort(
    (a, b) => b.allianceRankPoints + b.robotScouts - (a.allianceRankPoints + a.robotScouts)
  );

  const overviewCharts = [
    { name: 'Alliance Scouts', value: allianceData.length, color: '#ff6b6b' },
    { name: 'Robot Scouts', value: robotData.length, color: '#4dabf7' },
  ];

  const rankingChartData = teamStats.slice(0, 15).map((t) => ({
    team: t.team,
    points: Math.round(t.allianceRankPoints * 10) / 10,
  }));

  const selectedTeamStats = selectedTeam ? teamStatsMap.get(selectedTeam) : null;

  return (
    <div className="admin">
      <header>
        <h1>Admin Dashboard</h1>
        <p className="count">{data.length} scout records</p>
        {eventInfo && <span className="event-badge">Event: {eventInfo.name}</span>}
        {eventInfo ? (
          <button type="button" className="btn-end-event" onClick={openEndEvent}>
            End Event
          </button>
        ) : (
          <button type="button" className="btn-begin-event" onClick={openBeginEvent}>
            Begin Event
          </button>
        )}
        <button type="button" className="logout" onClick={handleLogout}>
          Log out
        </button>
        <button type="button" className="back-link" onClick={() => navigate('/match-setup')}>
          ← Back to Scouting
        </button>
      </header>

      {endEventModal && (
        <div className="modal-overlay" onClick={() => setEndEventModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>End Event</h2>
            <p className="modal-warning">Are you absolutely sure? This will clear all scout data and unlock event selection.</p>
            <p className="modal-hint">Type CONFIRM to proceed:</p>
            <input
              type="text"
              value={endEventConfirm}
              onChange={(e) => setEndEventConfirm(e.target.value)}
              placeholder="CONFIRM"
              className="confirm-input"
            />
            <div className="modal-actions">
              <button
                type="button"
                className="btn-confirm-end"
                onClick={confirmEndEvent}
                disabled={endEventConfirm !== 'CONFIRM'}
              >
                End Event
              </button>
              <button type="button" className="modal-close" onClick={() => setEndEventModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {beginEventModal && (
        <div className="modal-overlay" onClick={() => setBeginEventModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Begin Event</h2>
            <p className="modal-hint">Select a Michigan event. All existing scout data will be wiped and teams will be restricted to this event.</p>
            {eventsLoading && <p>Loading events...</p>}
            {eventsError && <p className="error">{eventsError}</p>}
            <div className="event-list">
              {michiganEvents.map((ev) => (
                <button
                  key={ev.key}
                  type="button"
                  className="event-item"
                  onClick={() => selectEvent(ev)}
                >
                  <span className="event-name">{ev.name}</span>
                  <span className="event-dates">{ev.start_date} – {ev.end_date}</span>
                </button>
              ))}
            </div>
            <button type="button" className="modal-close" onClick={() => setBeginEventModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <nav className="tabs">
        {(['overview', 'rankings', 'teams', 'raw'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <>
          {tab === 'overview' && (
            <section className="admin-section">
              <h2>Data Overview</h2>
              <div className="chart-row">
                <div className="chart-card">
                  <h3>Scout Type Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={overviewCharts}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label
                      >
                        {overviewCharts.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-card">
                  <h3>Scouts Over Time</h3>
                  <p className="stat">
                    {allianceData.length} alliance scouts, {robotData.length} robot scouts
                  </p>
                  <p className="stat">
                    {teamStats.length} unique teams scouted
                  </p>
                </div>
              </div>

              <h3>Top Teams by Rank Points</h3>
              <div className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rankingChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="team" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="points" fill="#e94560" name="Alliance rank pts" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {tab === 'rankings' && (
            <section className="admin-section">
              <h2>Robot Rankings</h2>
              <div className="rankings-table-wrap">
                <table className="rankings-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Team</th>
                      <th>Alliance Pts</th>
                      <th>Robot Scouts</th>
                      <th>Cross Bump</th>
                      <th>Cross Tunnel</th>
                      <th>Pass Cycles</th>
                      <th>Score Cycles</th>
                      <th>Avg Cycle (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamStats.map((t, i) => (
                      <tr key={t.team}>
                        <td>{i + 1}</td>
                        <td>
                          <button
                            type="button"
                            className="team-link"
                            onClick={() => setSelectedTeam(t.team)}
                          >
                            {t.team}
                          </button>
                        </td>
                        <td>{t.allianceRankPoints.toFixed(1)}</td>
                        <td>{t.robotScouts}</td>
                        <td>{t.crossBump}</td>
                        <td>{t.crossTunnel}</td>
                        <td>{t.passingCycles}</td>
                        <td>{t.scoringCycles}</td>
                        <td>{t.avgCycleTimeMs != null ? (t.avgCycleTimeMs / 1000).toFixed(1) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'teams' && (
            <section className="admin-section">
              <h2>Individual Team Stats</h2>
              <div className="team-select">
                <label>Select team:</label>
                <select
                  value={selectedTeam || ''}
                  onChange={(e) => setSelectedTeam(e.target.value || null)}
                >
                  <option value="">Choose a team</option>
                  {teamStats.map((t) => (
                    <option key={t.team} value={t.team}>
                      {t.team}
                    </option>
                  ))}
                </select>
              </div>
              {selectedTeamStats && (
                <div className="team-detail">
                  <h3>Team {selectedTeamStats.team}</h3>
                  <TeamFocusTab
                    teamNumber={selectedTeamStats.team}
                    eventKey={eventInfo?.key ?? null}
                    scoutData={data}
                  />
                  <div className="stat-grid">
                    <div className="stat-box">
                      <span className="stat-label">Alliance rank points</span>
                      <span className="stat-value">{selectedTeamStats.allianceRankPoints.toFixed(1)}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Alliance scouts</span>
                      <span className="stat-value">{selectedTeamStats.allianceScouts}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Robot scouts</span>
                      <span className="stat-value">{selectedTeamStats.robotScouts}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Cross bump</span>
                      <span className="stat-value">{selectedTeamStats.crossBump}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Cross tunnel</span>
                      <span className="stat-value">{selectedTeamStats.crossTunnel}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Passing cycles</span>
                      <span className="stat-value">{selectedTeamStats.passingCycles}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Scoring cycles</span>
                      <span className="stat-value">{selectedTeamStats.scoringCycles}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Avg cycle time</span>
                      <span className="stat-value">
                        {selectedTeamStats.avgCycleTimeMs != null
                          ? `${(selectedTeamStats.avgCycleTimeMs / 1000).toFixed(1)}s`
                          : '—'}
                      </span>
                    </div>
                  </div>
                  <h4>Category rankings (points)</h4>
                  <div className="category-bars">
                    {Object.entries(selectedTeamStats.categories)
                      .filter(([, v]) => v > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, pts]) => (
                        <div key={cat} className="category-row">
                          <span>{cat}</span>
                          <div className="bar-wrap">
                            <div
                              className="bar-fill"
                              style={{ width: `${Math.min(100, (pts / 15) * 100)}%` }}
                            />
                          </div>
                          <span>{pts.toFixed(1)}</span>
                        </div>
                      ))}
                  </div>
                  <h4>Raw scout records</h4>
                  <div className="raw-records">
                    {data
                      .filter((r) => {
                        if (r.data.type === 'alliance') {
                          const all = [...r.data.matchSetup.redRobots, ...r.data.matchSetup.blueRobots];
                          return all.includes(selectedTeamStats.team);
                        }
                        return r.data.matchSetup.robotNumber === selectedTeamStats.team;
                      })
                      .map((r, i) => (
                        <div key={i} className="raw-record">
                          <pre>{JSON.stringify(r.data, null, 2)}</pre>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === 'raw' && (
            <section className="admin-section">
              <h2>All Raw Data</h2>
              <div className="raw-list">
                {data.map((row, i) => (
                  <details key={row.id || i} className="raw-item">
                    <summary>
                      {row.data.type} — {row.data.timestamp} — {row.data.scorerName}
                    </summary>
                    <pre>{JSON.stringify(row.data, null, 2)}</pre>
                  </details>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
