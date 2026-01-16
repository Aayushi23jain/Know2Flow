import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";


export default function Dashboard() {
  const { userId: paramUserId } = useParams();
  const userId = paramUserId || localStorage.getItem("userId");
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [meUid, setMeUid] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // determine the logged-in UID (protected)
    fetch("http://localhost:5000/user/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.userId) setMeUid(d.userId); })
      .catch(() => setMeUid(null));
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoadingUser(false);
      setUser(null);
      return;
    }
    setLoadingUser(true);
    fetch(`http://localhost:5000/user/${userId}`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("User not found");
        return r.json();
      })
      .then((data) => setUser(data))
      .catch((err) => {
        console.warn("Failed to fetch user:", err);
        setUser(null);
      })
      .finally(() => setLoadingUser(false));
  }, [userId]);

  const isOwner = meUid && meUid === userId;

  const feedbacks = [
    {
      reviewer: "Alice",
      rating: 5,
      text: "Great mentor! Helped me understand complex topics easily.",
    },
    {
      reviewer: "Bob",
      rating: 4,
      text: "Very supportive and patient. Highly recommend!",
    },
    {
      reviewer: "Charlie",
      rating: 4,
      text: "Good teaching skills, but could be more responsive.",
    },
  ];

  return (

<div className="min-h-screen relative overflow-hidden text-white
bg-[radial-gradient(ellipse_at_top_left,_rgba(255,186,73,0.08),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(255,215,0,0.05),_transparent_55%),linear-gradient(135deg,#0b0b10,#111421,#141a2b,#0a0c14)]">


   {/* ambient background glow */}
<div className="absolute top-[-120px] left-[-120px] w-[420px] h-[420px] bg-orange-400/10 rounded-full blur-[140px]" />
<div className="absolute bottom-[-120px] right-[-120px] w-[420px] h-[420px] bg-yellow-400/10 rounded-full blur-[140px]" />


      
<header className="w-full py-3
bg-gradient-to-r from-[#11131a]/80 to-[#0b0c10]/80
backdrop-blur-md border-b border-white/5">


  <div className="flex items-center justify-between px-4 md:px-8 max-w-full">
    {/* left: logo + name */}
    <div className="flex items-center gap-3">
  <img
    src="/logo.png"
    alt="Know2Flow Logo"
    className="w-8 h-8 object-contain"
  />
  <div className="text-2xl font-bold text-orange-400">
    Know2Flow
  </div>
</div>


    {/* right: nav + badges + compact profile */}
    <div className="flex items-center gap-6">
      <nav className="hidden md:flex gap-6 text-sm text-gray-300">
        
      <button
        onClick={() => navigate("/challenge")}
        className="hover:text-white transition-colors"
      >
        Challenge
      </button>

      <a href="/summary" className="hover:text-white">Summary</a>
      {/*  <a href="/leaderboard" className="hover:text-white">LeaderBoard</a> */}
        <button 
           onClick={() => navigate(`/leaderboard/${userId}`)} 
          className="hover:text-white transition-colors"
        >
          LeaderBoard
        </button>
      </nav>
      


      <div className="hidden md:flex items-center gap-4 text-sm">
        
        <div className="flex items-center gap-1 text-red-400"><span>🔥</span><span className="text-white">{user?.streak ?? 0}</span></div>
      </div>

     
    </div>
  </div>
</header>
      
      {/* Main single-column content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center flex flex-col items-center">
  <img
    src="/logo.png"
    alt="Know2Flow Logo"
    className="w-24 h-24 mb-4 object-contain"
  />

  <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-white">
    KNOW2FLOW
  </h1>

  <p className="mt-6 text-center text-gray-300 italic">
    Swap Skills, No Bills
  </p>
</div>


        {/* Full-width profile card */}
        <div className="mt-10 mb-10 relative rounded-2xl p-6
bg-gradient-to-br from-[#161a23] via-[#0f1117] to-[#0b0c10]
border border-white/10
shadow-[0_40px_90px_rgba(0,0,0,0.95),_0_0_0_1px_rgba(0,0,0,0.8)]
backdrop-blur-sm">
<div className="absolute inset-0 rounded-2xl
bg-gradient-to-br from-orange-400/4 via-transparent to-yellow-400/4 pointer-events-none" />

          {loadingUser ? (
            <div className="animate-pulse">
              <div className="w-20 h-20 rounded-full bg-orange-400 mb-4" />
              <div className="h-4 bg-gray-700 rounded w-48 mb-2" />
              <div className="h-3 bg-gray-700 rounded w-32" />
            </div>
          ) : user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-black font-bold text-2xl">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <div className="text-lg font-semibold">{user.name || "Guest"}</div>
                  <div className="text-sm text-gray-400">{user.email || ""}</div>
                  <div className="text-xs text-gray-400 mt-1">Tokens: <span className="text-yellow-400">{user.tokens ?? 0}</span></div>
                  <div className="flex items-center gap-1 mt-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`text-xl ${star <= 4 ? "text-yellow-400" : "text-gray-500"}`}
        title="4 out of 5 stars"
      >
        ★
      </span>
    ))}


    {/* RIGHT: medal */}
  {/* Achievement Badge – top right */}
<img
  src="/medal.png"
  alt="Achievement Badge"
  title="Achievement Badge"
  className="absolute top-10 right-6 w-20 h-20 object-contain opacity-95"
/>

  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 font-semibold mb-2">Teach Skills</div>
                <div className="flex flex-wrap gap-2">
                  {(user.teachSkills || []).map((s, i) => (
                    <span key={i} className="bg-gray-700 px-3 py-1 rounded-full text-sm">{s}</span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 font-semibold mb-2">Learn Skills</div>
                <div className="flex flex-wrap gap-2">
                  {(user.learnSkills || []).map((s, i) => (
                    <span key={i} className="bg-gray-700 px-3 py-1 rounded-full text-sm">{s}</span>
                  ))}
                </div>
              </div>

              <div className="mt-8">
              <h3 className="font-semibold text-gray-300 mb-3">
                Feedback Received
              </h3>
              <div className="space-y-4">
                {feedbacks.slice(0, 3).map((fb, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-semibold text-yellow-300">
                        {fb.reviewer}
                      </div>
                      <div className="text-gray-200 mt-1">{fb.text}</div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 sm:mt-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            star <= fb.rating
                              ? "text-yellow-400"
                              : "text-gray-500"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end mt-2">
                  <span
                    className="cursor-pointer text-yellow-400 hover:text-orange-400 font-semibold transition"
                    onClick={() => alert("View more feedbacks coming soon!")}
                  >
                    View More
                  </span>
                </div>
              </div>
            </div>

              <div className="flex gap-3 flex-col sm:flex-row">
                {isOwner && (
                  <button
                    onClick={() => navigate(`/edit/${userId}`)}
                    className="w-full sm:w-auto bg-yellow-400 text-black py-2 px-4 rounded-lg font-semibold"
                  >
                    Edit Profile
                  </button>
                )}

                <button
                  onClick={() => { localStorage.removeItem("userId"); window.location.href = "/login"; }}
                  className="w-full sm:w-auto bg-red-600 text-white py-2 px-4 rounded-lg"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              No profile found. <button onClick={() => navigate("/signup")} className="underline">Create one</button>
            </div>
          )}
        </div>

       

        {/* Bottom actions */}
        

        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-6">

        

  
  {/* Match Skills */}
  <button
    onClick={() => navigate(`/matches/${userId}`)}
    disabled={!userId}
    className="relative group bg-gradient-to-r from-yellow-400 to-orange-400
    text-black px-7 py-3 rounded-full font-bold tracking-wide
    shadow-[0_20px_50px_rgba(150,140,21,0.45)]
    hover:shadow-[0_25px_70px_rgba(150,140,21,0.7)]
    hover:scale-105 transition-all duration-300
    disabled:opacity-60 disabled:hover:scale-100"
  >
    <span className="relative z-10">Match Skills</span>

    {/* glow ring */}
    <span className="absolute inset-0 rounded-full
    bg-yellow-400/30 blur-xl opacity-0 group-hover:opacity-100 transition" />
  </button>

    

  {/* Chat */}
  <button
    onClick={() => alert("Chat coming soon!")}
    className="relative group bg-gradient-to-br from-[#1a1d2b] to-[#0b0c10]
    text-gray-100 px-6 py-3 rounded-full
    border border-white/10
    shadow-[0_15px_40px_rgba(0,0,0,0.9)]
    hover:bg-[#1f2233] hover:scale-105 transition-all duration-300"
  >
    <span className="relative z-10">💬 Chat</span>

    {/* subtle hover glow */}
    <span className="absolute inset-0 rounded-full
    bg-white/5 blur-lg opacity-0 group-hover:opacity-100 transition" />
  </button>
</div>

      </main>
    </div>
  );
}

