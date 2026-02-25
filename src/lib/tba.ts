// The Blue Alliance API v3 client
// https://www.thebluealliance.com/apidocs/v3

const BASE = 'https://www.thebluealliance.com/api/v3';

function getHeaders(): HeadersInit {
  const key = import.meta.env.VITE_TBA_API_KEY;
  if (!key) throw new Error('VITE_TBA_API_KEY is required for TBA features');
  return { 'X-TBA-Auth-Key': key };
}

export interface TBAEvent {
  key: string;
  name: string;
  event_code: string;
  event_type: number;
  district?: { key: string; abbreviation: string; display_name: string };
  city?: string;
  state_prov?: string;
  country?: string;
  start_date: string;
  end_date: string;
  year: number;
}

export interface TBATeam {
  key: string;
  team_number: number;
  nickname?: string;
  name: string;
  city?: string;
  state_prov?: string;
  country?: string;
}

export interface TBAMatch {
  key: string;
  comp_level: 'qm' | 'qf' | 'sf' | 'f';
  set_number: number;
  match_number: number;
  alliances?: {
    red?: { team_keys: string[] };
    blue?: { team_keys: string[] };
  };
  score_breakdown?: Record<string, unknown>;
}

export interface TBAMedia {
  type: string;
  foreign_key?: string;
  details?: { base64Image?: string };
  direct_url?: string;
  view_url?: string;
}

export interface EventOPRs {
  [teamKey: string]: number;
}

export async function fetchMichiganEvents(year?: number): Promise<TBAEvent[]> {
  const y = year ?? new Date().getFullYear();
  const districtKey = `${y}fim`;
  const res = await fetch(`${BASE}/district/${districtKey}/events`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`TBA fetch failed: ${res.status}`);
  const events = (await res.json()) as TBAEvent[];
  return events.sort((a, b) => a.start_date.localeCompare(b.start_date));
}

export async function fetchEventTeams(eventKey: string): Promise<TBATeam[]> {
  const res = await fetch(`${BASE}/event/${eventKey}/teams/simple`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`TBA fetch failed: ${res.status}`);
  const teams = (await res.json()) as TBATeam[];
  return teams.sort((a, b) => a.team_number - b.team_number);
}

export async function fetchEventOPRs(eventKey: string): Promise<EventOPRs | null> {
  const res = await fetch(`${BASE}/event/${eventKey}/oprs`, { headers: getHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.oprs ?? null;
}

export async function fetchEventMatches(eventKey: string): Promise<TBAMatch[]> {
  const res = await fetch(`${BASE}/event/${eventKey}/matches`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`TBA fetch failed: ${res.status}`);
  return (await res.json()) as TBAMatch[];
}

export async function fetchTeamMedia(teamKey: string, year?: number): Promise<TBAMedia[]> {
  const y = year ?? new Date().getFullYear();
  const res = await fetch(`${BASE}/team/${teamKey}/media/${y}`, {
    headers: getHeaders(),
  });
  if (!res.ok) return [];
  const media = (await res.json()) as TBAMedia[];
  return media.filter((m) => m.type === 'avatar' || m.type === 'imgur' || m.type === 'cdphotothread');
}

export function teamKeyToNumber(teamKey: string): string {
  return teamKey.replace('frc', '');
}

export function extractClimbFromMatch(
  match: TBAMatch,
  teamKey: string
): { status: string; points?: number } | null {
  const sb = match.score_breakdown as Record<string, unknown> | undefined;
  if (!sb) return null;

  const alliance = match.alliances?.red?.team_keys.includes(teamKey)
    ? 'red'
    : match.alliances?.blue?.team_keys.includes(teamKey)
      ? 'blue'
      : null;
  if (!alliance) return null;

  const allianceBreakdown = sb[alliance] as Record<string, unknown> | undefined;
  if (!allianceBreakdown) return null;

  const teamKeys = (alliance === 'red'
    ? match.alliances?.red?.team_keys
    : match.alliances?.blue?.team_keys) as string[] | undefined;
  const idx = teamKeys?.indexOf(teamKey) ?? -1;
  if (idx < 0) return null;

  const idx1 = idx + 1;
  const endgameKey = `endGameRobot${idx1}`;
  const endgame = allianceBreakdown[endgameKey];

  if (typeof endgame === 'string') {
    return { status: endgame };
  }
  if (typeof endgame === 'object' && endgame !== null) {
    const o = endgame as Record<string, unknown>;
    return {
      status: String(o.endgameRobot ?? o.robot ?? o.status ?? 'unknown'),
      points: Number(o.endgamePoints ?? o.points ?? 0) || undefined,
    };
  }
  return null;
}
