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

  return (
     <div className="min-h-screen bg-gradient-to-r from-black via-gray-900 to-gray-800 text-white">
      
<header className="w-full bg-gradient-to-r from-gray-900 to-black py-3">
  <div className="flex items-center justify-between px-4 md:px-8 max-w-full">
    {/* left: logo + name */}
    <div className="flex items-center gap-3">
      
      <div className="text-2xl font-bold text-orange-400">Know2Flow</div>
    </div>

    {/* right: nav + badges + compact profile */}
    <div className="flex items-center gap-6">
      <nav className="hidden md:flex gap-6 text-sm text-gray-300">
        
        <a href="/challenge" className="hover:text-white">Challenge</a>
        <a href="/feedback" className="hover:text-white">Feedback</a>
        <a href="/leaderboard" className="hover:text-white">LeaderBoard</a>
      </nav>

      <div className="hidden md:flex items-center gap-4 text-sm">
        
        <div className="flex items-center gap-1 text-red-400"><span>🔥</span><span className="text-white">{user?.streak ?? 0}</span></div>
      </div>

      {/* compact right-side profile (desktop only) */}
      {/* <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-800">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-black font-bold">
          {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
        </div>
      </div> */}
    </div>
  </div>
</header>
      
      {/* Main single-column content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-white">
            KNOW2FLOW
          </h1>
           <p className="mt-6 text-center text-gray-300 italic">Swap Skills, No Bills</p>
        </div>

        {/* Full-width profile card (was right side) */}
        <div className="mt-6 bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 shadow-xl">
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

              <div className="flex gap-3 flex-col sm:flex-row">
                {isOwner && (
                  <button
                    onClick={() => navigate(`/profile/${userId}`)}
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
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => navigate(`/matches/${userId}`)}
            className="bg-yellow-400 text-black px-5 py-3 rounded-full font-bold disabled:opacity-60"
            disabled={!userId}
          >
            Match Skills
          </button>

          <button
            onClick={() => alert("Chat coming soon!")}
            className="bg-gray-800 text-gray-100 px-4 py-3 rounded-full"
          >
            💬 Chat
          </button>
        </div>

        {/* small footnote */}
        <div className="mt-6 text-center text-xs text-gray-500">
          {user?.updatedAt ? `Last updated: ${new Date(user.updatedAt.seconds * 1000).toLocaleString()}` : ""}
        </div>
      </main>
    </div>
  );
}


// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";

// export default function Dashboard() {
//   const { userId: paramUserId } = useParams();
//   const userId = paramUserId || localStorage.getItem("userId");
//   const [user, setUser] = useState(null);
//   const [loadingUser, setLoadingUser] = useState(true);
//   const [meUid, setMeUid] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // determine the logged-in UID (protected)
//     fetch("http://localhost:5000/user/me", { credentials: "include" })
//       .then((r) => (r.ok ? r.json() : null))
//       .then((d) => { if (d?.userId) setMeUid(d.userId); })
//       .catch(() => setMeUid(null));
//   }, []);

//   useEffect(() => {
//     if (!userId) {
//       setLoadingUser(false);
//       setUser(null);
//       return;
//     }
//     setLoadingUser(true);
//     fetch(`http://localhost:5000/user/${userId}`, { credentials: "include" })
//       .then((r) => {
//         if (!r.ok) throw new Error("User not found");
//         return r.json();
//       })
//       .then((data) => setUser(data))
//       .catch((err) => {
//         console.warn("Failed to fetch user:", err);
//         setUser(null);
//       })
//       .finally(() => setLoadingUser(false));
//   }, [userId]);

//   const isOwner = meUid && meUid === userId;

//   return (
//     <div className="min-h-screen bg-gradient-to-r from-black via-gray-900 to-gray-800 text-white">
//       {/* Centered brand */}
//       <header className="py-6">
        
//           <div className="text-2xl md:text-3xl font-bold text-orange-400">Know2Flow</div>
        
//       </header>
//       {/* Nav menu + quick badges */}
// <div className="mt-2 flex flex-col sm:flex-row items-right justify-right gap-4">
//   <nav className="flex gap-6 text-sm text-gray-300">
//     <a href="/challenge" className="hover:text-white">Challenge</a>
//     <a href="/leaderboard" className="hover:text-white">LeaderBoard</a>
//     <a href="/feedback" className="hover:text-white">Feedback</a>
//   </nav>

//   <div className="flex gap-3 items-center text-sm">
//     <div className="flex items-center gap-1 text-yellow-400">
//       <span>⭐</span>
//       <span className="text-white">{user?.stars ?? 0}</span>
//     </div>
//     <div className="flex items-center gap-1 text-red-400">
//       <span>🔥</span>
//       <span className="text-white">{user?.streak ?? 0}-day</span>
//     </div>
//   </div>
// </div>
//       {/* Main single-column content */}
//       <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Title */}
//         <div className="text-center">
//           <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-white">
//             KNOW2FLOW
//           </h1>
//            <p className="mt-6 text-center text-gray-300 italic">Swap Skills, No Bills</p>
//         </div>

//         {/* Full-width profile card (was right side) */}
//         <div className="mt-6 bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 shadow-xl">
//           {loadingUser ? (
//             <div className="animate-pulse">
//               <div className="w-20 h-20 rounded-full bg-orange-400 mb-4" />
//               <div className="h-4 bg-gray-700 rounded w-48 mb-2" />
//               <div className="h-3 bg-gray-700 rounded w-32" />
//             </div>
//           ) : user ? (
//             <div className="space-y-4">
//               <div className="flex items-center gap-4">
//                 <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-black font-bold text-2xl">
//                   {user.name ? user.name.charAt(0).toUpperCase() : "U"}
//                 </div>
//                 <div>
//                   <div className="text-lg font-semibold">{user.name || "Guest"}</div>
//                   <div className="text-sm text-gray-400">{user.email || ""}</div>
//                   <div className="text-xs text-gray-400 mt-1">Tokens: <span className="text-yellow-400">{user.tokens ?? 0}</span></div>
//                 </div>
//               </div>

//               <div>
//                 <div className="text-sm text-gray-400 font-semibold mb-2">Teach Skills</div>
//                 <div className="flex flex-wrap gap-2">
//                   {(user.teachSkills || []).map((s, i) => (
//                     <span key={i} className="bg-gray-700 px-3 py-1 rounded-full text-sm">{s}</span>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <div className="text-sm text-gray-400 font-semibold mb-2">Learn Skills</div>
//                 <div className="flex flex-wrap gap-2">
//                   {(user.learnSkills || []).map((s, i) => (
//                     <span key={i} className="bg-gray-700 px-3 py-1 rounded-full text-sm">{s}</span>
//                   ))}
//                 </div>
//               </div>

//               <div className="flex gap-3 flex-col sm:flex-row">
//                 {isOwner && (
//                   <button
//                     onClick={() => navigate(`/profile/${userId}`)}
//                     className="w-full sm:w-auto bg-yellow-400 text-black py-2 px-4 rounded-lg font-semibold"
//                   >
//                     Edit Profile
//                   </button>
//                 )}

//                 <button
//                   onClick={() => { localStorage.removeItem("userId"); window.location.href = "/login"; }}
//                   className="w-full sm:w-auto bg-red-600 text-white py-2 px-4 rounded-lg"
//                 >
//                   Logout
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <div className="text-center text-gray-400">
//               No profile found. <button onClick={() => navigate("/signup")} className="underline">Create one</button>
//             </div>
//           )}
//         </div>

       

//         {/* Bottom actions */}
//         <div className="mt-6 flex justify-center gap-4">
//           <button
//             onClick={() => navigate(`/matches/${userId}`)}
//             className="bg-yellow-400 text-black px-5 py-3 rounded-full font-bold disabled:opacity-60"
//             disabled={!userId}
//           >
//             Match Skills
//           </button>

//           <button
//             onClick={() => alert("Chat coming soon!")}
//             className="bg-gray-800 text-gray-100 px-4 py-3 rounded-full"
//           >
//             💬 Chat
//           </button>
//         </div>

//         {/* small footnote */}
//         <div className="mt-6 text-center text-xs text-gray-500">
//           {user?.updatedAt ? `Last updated: ${new Date(user.updatedAt.seconds * 1000).toLocaleString()}` : ""}
//         </div>
//       </main>
//     </div>
//   );
// }


