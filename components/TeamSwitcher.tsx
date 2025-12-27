'use client';
import { useTeam } from '@/context/TeamContext';

export default function TeamSwitcher() {
  const { teams, activeTeam, setActiveTeam, loading } = useTeam();

  // Handle the loading state gracefully so the UI doesn't jump
  if (loading) {
    return (
      <div className="flex flex-col animate-pulse">
        <div className="h-2 w-16 bg-gray-200 rounded mb-2"></div>
        <div className="h-9 w-48 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  // If for some reason the Yahoo sync failed or returned no teams
  if (!teams || teams.length === 0) return null;

  return (
    <div className="flex flex-col min-w-[200px]">
      <label 
        htmlFor="team-select" 
        className="text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1 tracking-wider"
      >
        Active Team & League
      </label>
      
      <div className="relative">
        <select
          id="team-select"
          value={activeTeam?.team_key || ''}
          onChange={(e) => {
            const team = teams.find(t => t.team_key === e.target.value);
            if (team) setActiveTeam(team);
          }}
          className="block w-full bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-2.5 pr-10 appearance-none cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
        >
          {teams.map((team) => (
            <option key={team.team_key} value={team.team_key}>
              {team.team_name} — {team.seasonYear === 458 ? '2025' : team.seasonYear}
            </option>
          ))}
        </select>
        
        {/* Custom Chevron Arrow for that "Pro" look */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
}