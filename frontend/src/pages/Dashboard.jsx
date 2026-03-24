import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { io } from "socket.io-client";

export default function Dashboard() {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  
  // State Management
  const userId = paramUserId || localStorage.getItem("userId");
  const [user, setUser] = useState(null);
  const [meUid, setMeUid] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Chat & Socket State
  const socketRef = useRef(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [missedCalls, setMissedCalls] = useState([]);
  
  // Feedback State
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false);

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(1)
    : null;

  // 1. Auth Check: Get current logged in user
 // 1. Auth Check: Get current logged in user
useEffect(() => {
  // Check localStorage first for instant UI response
  const savedId = localStorage.getItem("userId");
  if (savedId) setMeUid(savedId);

  fetch("http://localhost:5000/user/me", { credentials: "include" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d?.userId) {
        setMeUid(d.userId);
        localStorage.setItem("userId", d.userId); // Sync back
      }
    })
    .catch(() => {
      // If unauthorized, clear everything
      setMeUid(null);
      localStorage.removeItem("userId");
    });
}, []);
  // 2. Fetch Profile Data
  useEffect(() => {
    if (!userId) {
      setLoadingUser(false);
      return;
    }
    setLoadingUser(true);
    fetch(`http://localhost:5000/user/${userId}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch((err) => console.warn("Failed to fetch user:", err))
      .finally(() => setLoadingUser(false));
  }, [userId]);

  // 3. Fetch Feedbacks from Firestore
  useEffect(() => {
    if (!userId) return;
    setLoadingFeedbacks(true);
    const feedbackRef = collection(db, "users", userId, "feedbacks");
    const q = query(feedbackRef, orderBy("createdAt", "desc"));
    
    getDocs(q)
      .then((snap) => {
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setFeedbacks(data);
      })
      .catch((err) => console.error("Feedback fetch error:", err))
      .finally(() => setLoadingFeedbacks(false));
  }, [userId]);

  // 4. Listen for Missed Calls
  useEffect(() => {
    if (!meUid) return;
    const q = query(
      collection(db, "calls"),
      where("to", "==", meUid),
      where("status", "==", "missed")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMissedCalls(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [meUid]);

  // 5. Socket.io Notifications
  useEffect(() => {
    if (!meUid) return;
    socketRef.current = io("http://localhost:5000", { withCredentials: true });

    socketRef.current.on("newMessageNotification", (data) => {
      setUnreadCounts((prev) => ({
        ...prev,
        [data.senderId]: (prev[data.senderId] || 0) + 1,
      }));
    });

    return () => socketRef.current.disconnect();
  }, [meUid]);

  const isOwner = meUid && meUid === userId;

  return (
    <div className="min-h-screen relative overflow-hidden text-white bg-[radial-gradient(ellipse_at_top_left,_rgba(255,186,73,0.08),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(255,215,0,0.05),_transparent_55%),linear-gradient(135deg,#0b0b10,#111421,#141a2b,#0a0c14)]">
      
      {/* Background Glows */}
      <div className="absolute top-[-120px] left-[-120px] w-[420px] h-[420px] bg-orange-400/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[420px] h-[420px] bg-yellow-400/10 rounded-full blur-[140px]" />

      <header className="w-full py-3 bg-gradient-to-r from-[#11131a]/80 to-[#0b0c10]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 md:px-8 max-w-full">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <div className="text-2xl font-bold text-orange-400">Know2Flow</div>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-6 text-sm text-gray-300">
              <button
                onClick={() => navigate("/challenge")}
                className="hover:text-white transition-colors"
              >
                Challenge
              </button>

              {/* <a href="/summary" className="hover:text-white">
                Summary
              </a> */}
              {/*  <a href="/leaderboard" className="hover:text-white">LeaderBoard</a> */}
              <button
                onClick={() => navigate(`/leaderboard/${userId}`)}
                className="hover:text-white transition-colors"
              >
                LeaderBoard
              </button>
            </nav>
            <div className="flex items-center gap-1 text-red-400">
              <span>🔥</span><span className="text-white">{user?.streak ?? 0}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">

        <div className="text-center flex flex-col items-center">
          <img src="/logo.png" alt="Logo" className="w-24 h-24 mb-4 object-contain" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-white uppercase">
            Know2Flow
          </h1>
          <p className="mt-4 text-gray-300 italic">Swap Skills, No Bills</p>
        </div>



  {/* PROFILE CARD (PROFILE.JSX STYLE) */}
  <div
    className="mt-10 relative rounded-2xl p-8
    bg-gradient-to-br from-[#161a23] via-[#0f1117] to-[#0b0c10]
    border border-white/10
    shadow-[0_45px_110px_rgba(0,0,0,0.95)]
    backdrop-blur"
  >
    {/* inner glow */}
    <div className="absolute inset-0 rounded-2xl
      bg-gradient-to-br from-yellow-400/5 via-transparent to-orange-400/5 pointer-events-none"
    />

    {loadingUser ? (
      <div className="animate-pulse space-y-4">
        <div className="w-20 h-20 rounded-full bg-gray-700" />
        <div className="h-4 bg-gray-700 w-1/2 rounded" />
      </div>
    ) : user ? (
      <>
        {/* HEADER */}
        <div className="relative flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full
              bg-gradient-to-br from-yellow-400 to-orange-400
              flex items-center justify-center text-black font-bold text-2xl">
              {user.name?.[0]?.toUpperCase()}
            </div>

            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-400">{user.email}</p>

              <div className="mt-3 flex flex-col gap-2">
  <div className="flex items-center gap-2">
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`text-lg ${
            s <= Math.round(avgRating || 0)
              ? "text-yellow-400"
              : "text-gray-500"
          }`}
        >
          ★
        </span>
      ))}
    </div>

    {avgRating && (
      <span className="text-xs text-gray-400">({avgRating})</span>
    )}
  </div>

  <span className="text-yellow-400 font-semibold">
    Tokens: {user.tokens ?? 0}
  </span>
</div>

            </div>
          </div>

          {/* Medal */}
          <img
            src="/medal.png"
            className="absolute top-8 right-8 w-24 h-24 opacity-90"
            alt="medal"
          />
        </div>

        {/* SKILLS */}
        <div className="mt-8">
          <h3 className="font-semibold text-gray-300">Teach Skills</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.teachSkills?.map((s, i) => (
              <span key={i}
                className="bg-gray-800/80 px-3 py-1 rounded-full text-sm">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-gray-300">Learn Skills</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.learnSkills?.map((s, i) => (
              <span key={i}
                className="bg-gray-800/80 px-3 py-1 rounded-full text-sm">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* FEEDBACK */}
        <div className="mt-8">
          <h3 className="font-semibold text-gray-300 mb-3">
            Feedback Received
          </h3>

          {loadingFeedbacks ? (
            <div className="text-gray-500 text-sm">Loading feedbacks...</div>
          ) : feedbacks.length === 0 ? (
            <div className="text-gray-500 text-sm">No feedbacks yet.</div>
          ) : (
            <div className="space-y-4">
              {(showAllFeedbacks ? feedbacks : feedbacks.slice(0, 3)).map((fb) => (
                <div
                  key={fb.id}
                  className="bg-gray-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-semibold text-yellow-300">
                      {fb.givenByName || "User"}
                    </div>
                    <div className="text-gray-200 mt-1">{fb.text}</div>
                  </div>

                  <div className="flex items-center gap-1 mt-2 sm:mt-0">
                    {[1,2,3,4,5].map((star) => (
                      <span key={star}
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

              {feedbacks.length > 3 && (
                <div className="flex justify-end mt-2">
                  <span
                    onClick={() => setShowAllFeedbacks(!showAllFeedbacks)}
                    className="cursor-pointer text-yellow-400 hover:text-orange-400 font-semibold"
                  >
                    {showAllFeedbacks
                      ? "Show Less"
                      : `+${feedbacks.length - 3} more`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ACTION BUTTONS (PROFILE STYLE) */}
        <div className="mt-8 flex justify-between items-center">
          <div className="flex gap-4">

            {isOwner && (
              <button
                onClick={() => navigate(`/edit/${userId}`)}
                className="px-5 py-2 rounded-full
                bg-gradient-to-r from-yellow-400/15 to-orange-400/15
                border border-yellow-400/30
                hover:from-yellow-400/25 hover:to-orange-400/25"
              >
                Edit Profile
              </button>
            )}

            {/* <button
              onClick={() => navigate(`/matches/${userId}`)}
              className="px-5 py-2 rounded-full
              bg-gradient-to-r from-yellow-400/15 to-orange-400/15
              border border-yellow-400/30"
            >
              Match Skills
            </button>

            <button
              onClick={() => navigate("/chat")}
              className="px-5 py-2 rounded-full
              bg-gradient-to-r from-yellow-400/15 to-orange-400/15
              border border-yellow-400/30"
            >
              Chat
            </button> */}

          </div>

          <button
            onClick={() => {
              localStorage.removeItem("userId");
              window.location.href = "/login";
            }}
            className="px-5 py-2
            bg-gradient-to-r from-red-500/10 to-red-600/10
            border border-red-500/30
            hover:from-red-500/20 hover:to-red-600/20"
          >
            Logout
          </button>
        </div>

      </>
    ) : (
      <div className="text-center py-10 text-gray-400">
        Profile not found.
      </div>
    )}
  </div>

<div className="mt-10 flex justify-center">
  <div
    className="flex flex-col sm:flex-row items-center gap-4 px-6 py-5 rounded-2xl
    bg-gradient-to-r from-[#171b25]/95 via-[#11141d]/95 to-[#0d1018]/95
    border border-yellow-400/20
    shadow-[0_20px_60px_rgba(0,0,0,0.45)]
    backdrop-blur-md"
  >
    <button
      onClick={() => navigate(`/matches/${userId}`)}
      className="min-w-[180px] px-6 py-3 rounded-xl font-semibold tracking-wide
      text-black bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400
      shadow-[0_8px_30px_rgba(251,191,36,0.35)]
      hover:scale-105 hover:shadow-[0_12px_35px_rgba(249,115,22,0.35)]
      transition-all duration-300"
    >
      Match Skills
    </button>

    <button
      onClick={() => navigate("/chat")}
      className="min-w-[180px] px-6 py-3 rounded-xl font-semibold tracking-wide
      text-yellow-300 border border-yellow-400/40
      bg-gradient-to-r from-[#1a1f2b] to-[#10141d]
      hover:bg-gradient-to-r hover:from-yellow-400/10 hover:to-orange-400/10
      hover:text-white hover:scale-105
      transition-all duration-300"
    >
      💬  Chat
    </button>
  </div>
</div>


</main>
    </div>
  );
}