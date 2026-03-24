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
              <button onClick={() => navigate("/challenge")} className="hover:text-white transition-colors">Challenge</button>
              <button onClick={() => navigate("/summary")} className="hover:text-white transition-colors">Summary</button>
              <button onClick={() => navigate(`/leaderboard/${userId}`)} className="hover:text-white transition-colors">LeaderBoard</button>
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

        {/* Profile Card */}
        <div className="mt-10 relative rounded-2xl p-6 bg-gradient-to-br from-[#161a23] to-[#0b0c10] border border-white/10 shadow-2xl backdrop-blur-sm">
          {loadingUser ? (
            <div className="animate-pulse space-y-4">
              <div className="w-20 h-20 rounded-full bg-gray-700" />
              <div className="h-4 bg-gray-700 w-1/2 rounded" />
            </div>
          ) : user ? (
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-black font-bold text-3xl shadow-lg">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-yellow-400 text-sm font-bold">Tokens: {user.tokens ?? 0}</span>
                    <div className="flex text-yellow-500 ml-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={s <= Math.round(avgRating || 0) ? "opacity-100" : "opacity-30"}>★</span>
                      ))}
                    </div>
                    {avgRating && <span className="text-xs text-gray-500">({avgRating})</span>}
                  </div>
                </div>
                <img src="/medal.png" className="absolute top-6 right-6 w-16 h-16 opacity-80" alt="medal" />
              </div>

              {/* Skills Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Teach Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {user.teachSkills?.map((s, i) => (
                      <span key={i} className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full text-xs">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Learn Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {user.learnSkills?.map((s, i) => (
                      <span key={i} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feedback Section */}
              <div className="pt-6 border-t border-white/5">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Reviews</h3>
                {loadingFeedbacks ? (
                  <p className="text-gray-600 text-sm italic">Loading reviews...</p>
                ) : feedbacks.length === 0 ? (
                  <p className="text-gray-600 text-sm italic">No reviews yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(showAllFeedbacks ? feedbacks : feedbacks.slice(0, 3)).map((fb) => (
                      <div key={fb.id} className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start">
                          <span className="text-yellow-400 font-semibold text-sm">{fb.givenByName || "User"}</span>
                          <div className="flex text-[10px] text-yellow-500">
                            {Array(fb.rating).fill("★")}
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm mt-1">{fb.text}</p>
                      </div>
                    ))}
                    {feedbacks.length > 3 && (
                      <button 
                        onClick={() => setShowAllFeedbacks(!showAllFeedbacks)}
                        className="text-xs text-orange-400 hover:underline pt-2"
                      >
                        {showAllFeedbacks ? "Show Less" : `View ${feedbacks.length - 3} more reviews`}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Actions */}
              <div className="flex gap-3 pt-4">
                {isOwner && (
                  <button onClick={() => navigate(`/edit/${userId}`)} className="flex-1 bg-yellow-400 text-black py-2.5 rounded-xl font-bold hover:bg-yellow-500 transition">
                    Edit Profile
                  </button>
                )}
                <button 
                  onClick={() => { localStorage.removeItem("userId"); window.location.href = "/login"; }}
                  className="px-6 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 py-2.5 rounded-xl transition text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">Profile not found.</p>
              <button onClick={() => navigate("/signup")} className="text-orange-400 underline mt-2">Create Account</button>
            </div>
          )}
        </div>

        {/* Global Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate(`/matches/${userId}`)}
            className="group relative bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-10 py-4 rounded-full font-black uppercase tracking-tighter shadow-xl hover:scale-105 transition-all"
          >
            Match Skills
            <div className="absolute inset-0 rounded-full bg-yellow-400 blur-lg opacity-0 group-hover:opacity-20 transition" />
          </button>

          <div className="flex items-center gap-6">

            <button

  onClick={() => navigate("/chat")} // or `/chat/${userId}` if you want

  className="relative group bg-gray-800 px-4 py-2 rounded-full hover:bg-gray-700 transition"

>

  💬 Chat

</button>

          </div>
        </div>
      </main>
    </div>
  );
}