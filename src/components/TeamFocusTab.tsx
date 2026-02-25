import { useState, useEffect } from 'react';
import {
  fetchTeamMedia,
  fetchEventOPRs,
  fetchEventMatches,
  extractClimbFromMatch,
} from '../lib/tba';
import type { ScoutDataRow } from '../lib/db';

interface TeamFocusTabProps {
  teamNumber: string;
  eventKey: string | null;
  scoutData: ScoutDataRow[];
}

interface ClimbRecord {
  matchKey: string;
  matchNumber: string;
  status: string;
  points?: number;
}

export default function TeamFocusTab({ teamNumber, eventKey, scoutData }: TeamFocusTabProps) {
  const [teamImage, setTeamImage] = useState<string | null>(null);
  const [opr, setOpr] = useState<number | null>(null);
  const [climbs, setClimbs] = useState<ClimbRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const teamKey = `frc${teamNumber}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const hasKey = !!import.meta.env.VITE_TBA_API_KEY;
        if (!hasKey) {
          setLoading(false);
          return;
        }

        const [mediaRes, oprRes, matchesRes] = await Promise.all([
          fetchTeamMedia(teamKey).catch(() => []),
          eventKey ? fetchEventOPRs(eventKey) : Promise.resolve(null),
          eventKey ? fetchEventMatches(eventKey) : Promise.resolve([]),
        ]);

        if (cancelled) return;

        const img = mediaRes.find((m) => m.direct_url || m.view_url);
        if (img?.direct_url) setTeamImage(img.direct_url);
        else if (img?.view_url) setTeamImage(img.view_url);

        if (oprRes && teamKey in oprRes) setOpr(oprRes[teamKey]);

        const teamMatchNumbers = new Set<string>();
        for (const r of scoutData) {
          const ms = r.data.matchSetup;
          if (!ms?.matchNumber) continue;
          const allTeams = [...ms.redRobots, ...ms.blueRobots];
          if (allTeams.includes(teamNumber) || ms.robotNumber === teamNumber) {
            const n = ms.matchNumber.toUpperCase();
            teamMatchNumbers.add(n.startsWith('Q') ? n : `Q${n}`);
          }
        }

        const climbList: ClimbRecord[] = [];
        for (const m of matchesRes) {
          if (m.comp_level !== 'qm') continue;
          const qmNum = `Q${m.match_number}`;
          if (!teamMatchNumbers.has(qmNum) && !teamMatchNumbers.has(qmNum.toUpperCase())) continue;
          const climb = extractClimbFromMatch(m, teamKey);
          if (climb) {
            climbList.push({
              matchKey: m.key,
              matchNumber: qmNum,
              status: climb.status,
              points: climb.points,
            });
          }
        }
        setClimbs(climbList.sort((a, b) => a.matchNumber.localeCompare(b.matchNumber)));
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [teamKey, eventKey, scoutData]);

  if (loading && !teamImage && !opr && climbs.length === 0) {
    return <p className="tba-loading">Loading TBA data...</p>;
  }

  if (error) {
    return <p className="tba-error">TBA: {error}</p>;
  }

  if (!import.meta.env.VITE_TBA_API_KEY) {
    return null;
  }

  return (
    <div className="team-focus-tba">
      {teamImage && (
        <div className="team-image-wrap">
          <img src={teamImage} alt={`Team ${teamNumber}`} className="team-image" />
        </div>
      )}
      {opr != null && (
        <div className="stat-box tba-opr">
          <span className="stat-label">OPR (TBA)</span>
          <span className="stat-value">{opr.toFixed(1)}</span>
        </div>
      )}
      {climbs.length > 0 && (
        <>
          <h4>Climb (from TBA matches)</h4>
          <div className="climb-list">
            {climbs.map((c) => (
              <div key={c.matchKey} className="climb-row">
                <span>{c.matchNumber}</span>
                <span className="climb-status">{c.status}</span>
                {c.points != null && c.points > 0 && <span>{c.points} pts</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
