// src/pages/Leaderboard.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Leaderboard() {
  const { userId } = useParams(); 
  const navigate = useNavigate();

  // Static Data
  const users = [
    { id: "101", name: "Sarah Connor", points: 2450 },
    { id: "102", name: "John Doe", points: 2100 },
    { id: "103", name: "Alice Smith", points: 1950 },
    { id: userId, name: "Current User", points: 1800 }, // This represents the logged-in user
    { id: "105", name: "Michael B", points: 1600 },
    { id: "106", name: "Jessica T", points: 1200 },
  ];

  const sortedUsers = users.sort((a, b) => b.points - a.points);

  return (
    <div className="min-h-screen relative overflow-hidden text-white
      bg-[radial-gradient(ellipse_at_top_left,_rgba(255,186,73,0.08),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(255,215,0,0.05),_transparent_55%),linear-gradient(135deg,#0b0b10,#111421,#141a2b,#0a0c14)]">
      
      {/* Background Glows */}
      <div className="absolute top-[-120px] left-[-120px] w-[420px] h-[420px] bg-orange-400/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[420px] h-[420px] bg-yellow-400/10 rounded-full blur-[140px]" />

      <div className="p-6 relative z-10">
  <button
    onClick={() => navigate(`/dashboard/${userId}`)}
    className="text-gray-400 hover:text-white transition flex items-center gap-2"
  >
    ← Back
  </button>
</div>


      <main className="max-w-2xl mx-auto px-4 pb-12">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-200 uppercase tracking-widest">
                Leaderboard
            </h1>
            <p className="text-gray-400 mt-2 font-light italic">Top Skills Swappers</p>
        </div>

        <div className="bg-[#161a23]/80 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 p-5 border-b border-white/5 text-gray-500 text-xs font-bold uppercase tracking-widest">
                <div className="col-span-2 text-center">Rank</div>
                <div className="col-span-7">Username</div>
                <div className="col-span-3 text-right">Points</div>
            </div>

            {/* Players List */}
            <div className="flex flex-col">
                {sortedUsers.map((user, index) => {
                    const isCurrentUser = user.id === userId;
                    const rank = index + 1;
                    
                    let rankStyle = "text-gray-400";
                    if(rank === 1) rankStyle = "text-yellow-400 text-2xl";
                    if(rank === 2) rankStyle = "text-gray-300 text-xl";
                    if(rank === 3) rankStyle = "text-orange-300 text-xl";

                    return (
                        <div 
                            key={user.id}
                            className={`grid grid-cols-12 gap-4 p-5 items-center transition-all duration-300
                                ${isCurrentUser 
                                    ? "bg-orange-500/20 border-l-4 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.1)]" 
                                    : "border-b border-white/5 last:border-0 hover:bg-white/5"
                                }
                            `}
                        >
                            {/* Rank */}
                            <div className={`col-span-2 text-center font-black ${rankStyle}`}>
                                {rank === 1 ? '🏆' : rank}
                            </div>

                            {/* Username - Logic updated here */}
                            <div className="col-span-7 flex items-center">
                                <h3 className={`font-semibold tracking-wide ${isCurrentUser ? 'text-orange-400 text-lg font-bold' : 'text-gray-200'}`}>
                                    {isCurrentUser ? "YOU" : user.name}
                                </h3>
                            </div>

                            {/* Points */}
                            <div className="col-span-3 text-right">
                                <span className={`font-mono font-bold text-lg ${isCurrentUser ? 'text-orange-400' : 'text-yellow-500/80'}`}>
                                    {user.points.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </main>
    </div>
  );
}