'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface Team {
  team_key: string;
  team_name: string;
  league_key: string;
  seasonYear: number;
  manager?: string; 
  // We assume the API returns something indicating if the team is "active" 
  // or we use the logic that if it exists in the list, we prioritize by year + data
}

interface TeamContextType {
  activeTeam: Team | null;
  setActiveTeam: (team: Team) => Promise<void>;
  teams: Team[];
  loading: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeamState] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch('/api/yahoo/my-teams');
        const data = await res.json();
        
        if (data.success && data.teams.length > 0) {
          
          // 1. SORT: Always put newest years first (2026, 2025, 2024...)
          const sortedTeams = data.teams.sort((a: Team, b: Team) => b.seasonYear - a.seasonYear);
          setTeams(sortedTeams);

          // 2. CHECK FOR SAVED PREFERENCE
          const savedKey = Cookies.get('active_team_key');
          const savedTeam = sortedTeams.find((t: Team) => t.team_key === savedKey);

          if (savedTeam) {
            // If we have a cookie and the team exists, honor it.
            setActiveTeamState(savedTeam);
          } else {
            // 3. THE EVERGREEN LOGIC (Smart Default)
            // If no cookie, don't just blindly pick [0] (which might be an empty 2026 team).
            // We want the most recent team that is "Real".
            // Since we sorted by year, the first one we find is the "Current" one.
            
            // Note: If your API returns a 'player_count', check that here. 
            // Otherwise, we default to the newest available team, which is the safest 
            // "Active Season" guess without inspecting rosters deeply yet.
            const defaultTeam = sortedTeams[0]; 
            
            setActiveTeamState(defaultTeam);
            
            // Set cookies so we remember this choice
            Cookies.set('active_team_key', defaultTeam.team_key);
            Cookies.set('active_league_key', defaultTeam.league_key);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user teams:", error);
      }
      setLoading(false);
    }
    fetchTeams();
  }, []);

  // --- SAME SYNC LOGIC AS BEFORE ---
  const setActiveTeam = async (team: Team) => {
    setActiveTeamState(team);
    Cookies.set('active_team_key', team.team_key);
    Cookies.set('active_league_key', team.league_key);

    try {
      await fetch('/api/yahoo/sync-league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ league_key: team.league_key }),
      });
    } catch (err) {
      console.error("League sync failed:", err);
    }
    window.location.reload(); 
  };

  return (
    <TeamContext.Provider value={{ activeTeam, setActiveTeam, teams, loading }}>
      {children}
    </TeamContext.Provider>
  );
}

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) throw new Error('useTeam must be used within TeamProvider');
  return context;
};