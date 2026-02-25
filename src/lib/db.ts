// Database layer - uses Supabase when configured, localStorage fallback otherwise

export interface MatchSetup {
  redRobots: [string, string, string];
  blueRobots: [string, string, string];
  watchMode: 'alliance' | 'robot';
  alliance?: 'red' | 'blue';
  robotNumber?: string;
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
