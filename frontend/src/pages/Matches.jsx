import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
export default function Matches() {
  const { userId } = useParams();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [receivedRequests, setReceivedRequests] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/search-profiles", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.matches || []);
        setLoading(false);
      })
      .catch(() => {
        setMatches([]);
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
  const auth = getAuth();

  const unsubscribe = auth.onAuthStateChanged((currentUser) => {
    if (!currentUser) return;

    const userRef = doc(db, "users", currentUser.uid);

    const unsubFirestore = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      setReceivedRequests(data.receivedRequests || []);
    });

    return () => unsubFirestore();
  });

  return () => unsubscribe();
}, []);

  return (
    <div className="min-h-screen relative overflow-hidden text-white px-8 py-10
    bg-gradient-to-br from-[#0b0b10] via-[#111421] to-[#0a0c14]">

      {/* ambient background glow */}
      <div className="absolute -top-40 -left-40 w-[420px] h-[420px] bg-yellow-400/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-140px] right-[-140px] w-[420px] h-[420px] bg-orange-400/10 rounded-full blur-[140px]" />

      <h1 className="relative text-4xl font-extrabold text-transparent bg-clip-text
      bg-gradient-to-r from-yellow-400 to-orange-400 mb-10">
        Skill Matches
      </h1>

      {loading && (
        <p className="relative text-gray-400 animate-pulse">
          Finding best matches...
        </p>
      )}

      {!loading && matches.length === 0 && (
        <p className="relative text-gray-400">
          No matching profiles found.
        </p>
      )}

      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {matches.map((m) => (
          <div
            key={m.userId}
            className="relative rounded-2xl p-6
            bg-gradient-to-br from-[#161a23] via-[#0f1117] to-[#0b0c10]
            border border-white/10
            shadow-[0_35px_80px_rgba(0,0,0,0.95)]
            hover:shadow-[0_45px_110px_rgba(0,0,0,1)]
            transition-all duration-300"
          >
            {/* subtle inner glow */}
            <div className="absolute inset-0 rounded-2xl
            bg-gradient-to-br from-yellow-400/5 via-transparent to-orange-400/5 pointer-events-none" />
          
         
            <div className="relative flex items-center justify-between">
  <h2 className="text-xl font-semibold">{m.name}</h2>

  {/* ✅ REQUEST INDICATOR */}
  {receivedRequests.includes(m.userId) && (
    <span className="text-xs bg-green-500/20 border border-green-400 text-green-300 px-2 py-1 rounded-full">
      Request Received
    </span>
  )}
</div>

            <p className="relative text-sm text-gray-400 mt-3">
              Match Score:{" "}
              <span className="text-yellow-400 font-bold">
                {(m.finalScore * 100).toFixed(0)}%
              </span>
            </p>

            <div className="relative mt-6 flex gap-4">
              {/* View Profile */}
              <button
                onClick={() => navigate(`/profile/${m.userId}`)}
                className="bg-gradient-to-r from-yellow-400 to-orange-400
                text-black px-5 py-2 rounded-full font-semibold
                shadow-[0_15px_40px_rgba(150,140,21,0.45)]
                hover:shadow-[0_20px_60px_rgba(150,140,21,0.7)]
                hover:scale-105 transition"
              >
                View Profile
              </button>
              
              
            </div>
          </div>
        ))}
      </div>

      <button
  onClick={() => {
    const auth = getAuth();
    const currentUserId = auth.currentUser?.uid;
    navigate(`/dashboard/${currentUserId}`);
  }}
  className="relative mt-12 text-gray-400 underline hover:text-white transition"
>
  ← Back
</button>
    </div>
  );
}