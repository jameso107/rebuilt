// Database layer - uses Supabase when configured, localStorage fallback otherwise

export interface MatchSetup {
  redRobots: [string, string, string];
  blueRobots: [string, string, string];
  watchMode: 'alliance' | 'robot';
  alliance?: 'red' | 'blue';
  robotNumber?: string;
  matchNumber?: string; // e.g. Q12
  eventKey?: string;
}

export interface AllianceScoutData {
  type: 'alliance';
  matchSetup: MatchSetup;
  scorerName: string;
  rankings: {
    accuracy: [string, string, string];
    volume: [string, string, string];
    defense: [string, string, string];
    awareness: [string, string, string];
    speed: [string, string, string];
    autonomous: [string, string, string];
  };
  comments: string;
  timestamp: string;
}

export interface RobotScoutData {
  type: 'robot';
  matchSetup: MatchSetup;
  scorerName: string;
  crossBump: number;
  crossTunnel: number;
  passingCycles: number;
  shootingSessions: { startTime: number; endTime: number }[];
  scoringCycleCount: number;
  averageCycleTimeMs: number | null; // avg time per scoring cycle in ms
  comments: string;
  timestamp: string;
}

export type ScoutData = AllianceScoutData | RobotScoutData;

const STORAGE_KEY = 'rebuilt_scout_data';

export async function submitScoutData(data: ScoutData): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('scout_data').insert({
      data: data as object,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Supabase error:', error);
      // Fallback to localStorage on error
      saveToLocalStorage(data);
    }
  } else {
    saveToLocalStorage(data);
  }
}

function saveToLocalStorage(data: ScoutData): void {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  existing.push(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getLocalScoutData(): ScoutData[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

export async function clearAllScoutData(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('scout_data').delete().gte('created_at', '1970-01-01');
    } catch (e) {
      console.error('Supabase clear error:', e);
    }
  }
}

export interface ScoutDataRow {
  id?: string;
  data: ScoutData;
  created_at?: string;
}

export interface EventInfo {
  key: string;
  name: string;
  teamNumbers: string[];
}

export async function getCurrentEvent(): Promise<EventInfo | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('current_event')
        .select('event_key, event_name, team_numbers')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        return {
          key: data.event_key,
          name: data.event_name,
          teamNumbers: data.team_numbers as string[],
        };
      }
    } catch (e) {
      console.error('getCurrentEvent error:', e);
    }
  }

  const stored = localStorage.getItem('rebuilt_event');
  return stored ? JSON.parse(stored) : null;
}

export async function setCurrentEvent(info: EventInfo): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('current_event').upsert(
        {
          id: 1,
          event_key: info.key,
          event_name: info.name,
          team_numbers: info.teamNumbers,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch (e) {
      console.error('setCurrentEvent error:', e);
    }
  }

  localStorage.setItem('rebuilt_event', JSON.stringify(info));
}

export async function clearCurrentEvent(): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('current_event').delete().eq('id', 1);
    } catch (e) {
      console.error('clearCurrentEvent error:', e);
    }
  }

  localStorage.removeItem('rebuilt_event');
}

export async function getAllScoutData(): Promise<ScoutDataRow[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('scout_data')
      .select('id, data, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return getLocalScoutData().map((d) => ({ data: d, created_at: new Date().toISOString() }));
    }

    return (data || []).map((row) => ({
      id: row.id,
      data: row.data as ScoutData,
      created_at: row.created_at,
    }));
  }

  return getLocalScoutData().map((d) => ({ data: d, created_at: new Date().toISOString() }));
}
