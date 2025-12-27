"use client";

import { useState } from "react";
import { useTeam } from "../context/TeamContext"; 

export default function TeamSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  
  // FIXED: Changed 'userTeams' to 'teams' to match your Context file
  const { activeTeam, teams, setActiveTeam } = useTeam(); 

  // Smart Label: Shows Team Name if synced, otherwise generic
  const buttonLabel = activeTeam ? `Viewing: ${activeTeam.team_name}` : "⚾ Sync League";

  return (
    <div style={{ position: "relative", zIndex: 99999 }}>
      
      {/* THE BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: activeTeam ? "#1b5e20" : "#d32f2f", // Green if synced, Red if not
          color: "white", 
          border: "1px solid rgba(255,255,255,0.3)", 
          padding: "6px 12px", 
          borderRadius: "6px",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          whiteSpace: "nowrap"
        }}
      >
        <span>{buttonLabel}</span>
        <span style={{ fontSize: "10px", opacity: 0.7 }}>▼</span>
      </button>

      {/* THE DROPDOWN MENU */}
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "125%",
          right: 0,
          background: "white",
          border: "1px solid #ccc",
          borderRadius: "8px",
          width: "240px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          zIndex: 100000,
          color: "black"
        }}>
          
          {/* List User's Teams if they exist */}
          {/* FIXED: Using 'teams' here instead of 'userTeams' */}
          {teams && teams.length > 0 && (
            <>
              <div style={{ padding: "8px", fontSize: "11px", color: "#666", fontWeight: "bold", textTransform: 'uppercase' }}>
                Your Leagues
              </div>
              {teams.map((team) => (
                <button
                  key={team.team_key}
                  onClick={() => {
                    setActiveTeam(team); 
                    setIsOpen(false);
                  }}
                  style={{
                    textAlign: "left",
                    padding: "10px",
                    background: activeTeam?.team_key === team.team_key ? "#e8f5e9" : "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: activeTeam?.team_key === team.team_key ? "bold" : "normal",
                    color: "#333"
                  }}
                >
                  {team.team_name}
                  <span style={{display: 'block', fontSize: '10px', color: '#888'}}>
                    {team.seasonYear} Season
                  </span>
                </button>
              ))}
              <div style={{ borderBottom: "1px solid #eee", margin: "4px 0" }}></div>
            </>
          )}

          {/* The "Add New" Button */}
          <button 
             onClick={() => {
               const url = new URL(window.location.href);
               url.searchParams.set('sync', 'true');
               window.history.pushState({}, '', url);
               window.location.reload(); 
             }}
             style={{
               background: "#f0f7ff",
               color: "#007bff",
               border: "1px dashed #007bff",
               padding: "10px",
               borderRadius: "6px",
               cursor: "pointer",
               fontWeight: "bold",
               fontSize: "12px",
               textAlign: "center"
             }}
          >
            + Link New League
          </button>
        </div>
      )}
    </div>
  );
}