import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { userId: paramUserId } = useParams();
  const userId = paramUserId || localStorage.getItem("userId");
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    // Fetch profile
    fetch(`http://localhost:5000/user/${userId}`)
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => {
        // fallback placeholder
        setUser({
          name: "Himanshi29",
          tokens: 256,
          rating: 4.5,
          teachSkills: ["Dancing", "Singing", "Makeup"],
          learnSkills: ["Weaving", "Cooking"],
        });
      });

    // Fetch matches (optional)
    fetch("http://localhost:5000/search-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
      .then((r) => r.json())
      .then((d) => setMatches(d.matches || []))
      .catch(() => setMatches([]));
  }, [userId]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-black via-gray-900 to-gray-800 text-white">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-orange-400">Know2Flow</div>
        </div>
        <nav className="hidden md:flex gap-6 text-sm text-gray-300">
          <a href="/home" className="hover:text-white">Home</a>
          <a href="/challenge" className="hover:text-white">Challenge</a>
          <a href="/feedback" className="hover:text-white">Feedback</a>
          <a href="/leaderboard" className="hover:text-white">LeaderBoard</a>
        </nav>
      </header>

      {/* Main layout */}
      <main className="px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hero / center (spans 2 columns on large screens) */}
        <section className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-black rounded-2xl p-10 shadow-xl flex flex-col justify-center items-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-white">
            KNOW2FLOW
          </h1>
          <p className="mt-4 text-xl text-gray-300 italic">Swap Skills, No Bills</p>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => {
                // trigger searches or go to matching page
                navigate(`/matches/${userId}`);
              }}
              className="bg-yellow-400 text-black font-bold px-8 py-3 rounded-full shadow hover:scale-105 transition"
            >
              Match Skills
            </button>

            <button
              onClick={() => alert("Chat coming soon!")}
              className="bg-gray-800 border border-gray-600 text-gray-200 px-5 py-3 rounded-full shadow"
            >
              💬 Chat
            </button>
          </div>

          {/* Matches preview */}
          <div className="w-full mt-10">
            <h3 className="text-lg font-semibold mb-4 text-gray-200">Suggested Matches</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matches.length === 0 ? (
                <div className="text-gray-400">No matches yet.</div>
              ) : (
                matches.map((m) => (
                  <div key={m.userId} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{m.name}</div>
                      <div className="text-sm text-gray-400">Score: {(m.finalScore * 100).toFixed(0)}%</div>
                    </div>
                    <button
                      className="bg-yellow-400 text-black px-3 py-1 rounded"
                      onClick={() => navigate(`/profile/${m.userId}`)}
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right profile card */}
        <aside className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-black font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="font-semibold text-lg">{user?.name || "User"}</div>
              <div className="text-sm text-gray-400">Token: <span className="text-yellow-400">{user?.tokens ?? 0}</span></div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm text-gray-400 font-semibold mb-2">Teach Skills</div>
            <div className="flex flex-wrap gap-2">
              {(user?.teachSkills || []).map((s, i) => (
                <span key={i} className="bg-gray-700 px-3 py-1 rounded-full text-sm">{s}</span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-400 font-semibold mb-2">Learn Skills</div>
            <div className="flex flex-wrap gap-2">
              {(user?.learnSkills || []).map((s, i) => (
                <span key={i} className="bg-gray-700 px-3 py-1 rounded-full text-sm">{s}</span>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                localStorage.removeItem("userId");
                navigate("/login");
              }}
              className="w-full bg-red-600 text-white py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </aside>
      </main>

      {/* Floating chat bubble */}
      <button
        aria-label="open chat"
        className="fixed right-6 bottom-6 bg-blue-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl"
        onClick={() => alert("Chat coming soon!")}
      >
        💬
      </button>
    </div>
  );
}
