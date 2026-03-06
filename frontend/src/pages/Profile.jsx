import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [popup, setPopup] = useState({ open: false, message: "" });
  const [confirmPopup, setConfirmPopup] = useState({ open: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calling, setCalling] = useState(false);
  const [callDocId, setCallDocId] = useState(null);
  const handleVideoCall = async () => {
    try {
      const currentUser = getAuth().currentUser;

      if (!currentUser) {
        alert("You must be logged in to make a call");
        return;
      }

      if (currentUser.uid === userId) {
        alert("You cannot call yourself");
        return;
      }

      const channelName =
        currentUser.uid < userId
          ? `${currentUser.uid}_${userId}`
          : `${userId}_${currentUser.uid}`;

      const callRef = await addDoc(collection(db, "calls"), {
        from: currentUser.uid,
        to: userId,
        channelName,
        status: "ringing",
        createdAt: serverTimestamp(),
      });
      setCallDocId(callRef.id);
      setCalling(true);

      const unsubscribe = onSnapshot(callRef, (docSnap) => {
        const data = docSnap.data();

        if (data?.status === "accepted") {
          setCalling(false);
          navigate(`/video-call/${channelName}/${callRef.id}`);
          unsubscribe();
        }

        if (data?.status === "rejected") {
          setCalling(false);
          alert("Call rejected");
          unsubscribe();
        }
      });
    } catch (error) {
      alert("Error initiating call: " + error.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`http://localhost:5000/user/${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error("User not found");
        return r.json();
      })
      .then((data) => {
        setUser(data);
      })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [userId]);

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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading profile...
      </div>
    );

  if (error)
    return <div className="min-h-screen p-6 text-red-400">Error: {error}</div>;

  return (
    <div
      className="min-h-screen relative overflow-hidden text-white p-6
    bg-gradient-to-br from-[#0b0b10] via-[#111421] to-[#0a0c14]"
    >
      {/* ambient glow */}
      <div className="absolute -top-40 -left-40 w-[420px] h-[420px] bg-yellow-400/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[420px] h-[420px] bg-orange-400/10 rounded-full blur-[140px]" />

      <button
        className="relative mb-6 text-sm text-gray-400 hover:text-white transition"
        onClick={() => navigate(`/matches/${userId}`)}
      >
        ← Back
      </button>

      {/* PROFILE CARD */}
      <div
        className="relative max-w-3xl mx-auto rounded-2xl p-8
      bg-gradient-to-br from-[#161a23] via-[#0f1117] to-[#0b0c10]
      border border-white/10
      shadow-[0_45px_110px_rgba(0,0,0,0.95)]
      backdrop-blur"
      >
        {/* inner glow */}
        <div
          className="absolute inset-0 rounded-2xl
        bg-gradient-to-br from-yellow-400/5 via-transparent to-orange-400/5 pointer-events-none"
        />

        {/* HEADER */}
        <div className="relative flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div
              className="w-20 h-20 rounded-full
bg-gradient-to-br from-yellow-400 to-orange-400
flex items-center justify-center text-black font-bold text-2xl
shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
            >
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>

            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-400">{user.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Country: {user.country || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 ml-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-2xl ${
                  star <= 4 ? "text-yellow-400" : "text-gray-500"
                }`}
                title="4 out of 5 stars"
              >
                ★
              </span>
            ))}
          </div>

          {/* Achievement Badge */}
          <img
            src="/medal.png"
            alt="Achievement Badge"
            title="Achievement Badge"
            className="absolute top-12 right-8 w-24 h-24 object-contain opacity-95"
          />
        </div>

        {/* CONTENT */}
        <>
          <div className="mt-8">
            <h3 className="font-semibold text-gray-300">Teach Skills</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(user.teachSkills || []).map((s, i) => (
                <span
                  key={i}
                  className="bg-gray-800/80 px-3 py-1 rounded-full text-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-300">Learn Skills</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(user.learnSkills || []).map((s, i) => (
                <span
                  key={i}
                  className="bg-gray-800/80 px-3 py-1 rounded-full text-sm"
                >
                  {s}
                </span>
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

          {/* ACTION BUTTONS – ALWAYS VISIBLE */}
          <div className="mt-8 flex justify-between items-center">
            <div className="flex gap-4">
              <button
                className="px-5 py-2 rounded-full
bg-gradient-to-r from-yellow-400/15 to-orange-400/15
border border-yellow-400/30
text-white-300
hover:from-yellow-400/25 hover:to-orange-400/25
hover:text-yellow-200
transition"
                onClick={() => navigate(`/chat/${userId}`)}
              >
                Message
              </button>
              <button
                className="px-5 py-2 rounded-full
bg-gradient-to-r from-yellow-400/15 to-orange-400/15
border border-yellow-400/30
text-white-300
hover:from-yellow-400/25 hover:to-orange-400/25
hover:text-yellow-200
transition"
                onClick={handleVideoCall}
              >
                Video Call
              </button>
              <button
                className="px-5 py-2 rounded-full
bg-gradient-to-r from-yellow-400/15 to-orange-400/15
border border-yellow-400/30
text-white-300
hover:from-yellow-400/25 hover:to-orange-400/25
hover:text-yellow-200
transition"
                onClick={() => navigate(`/feedback/${userId}`)}
              >
                Feedback
              </button>
            </div>
            <button
              className="px-5 py-2
bg-gradient-to-r from-red-500/10 to-red-600/10
border border-red-500/30
text-white-500
hover:from-red-500/20 hover:to-red-600/20
hover:text-red-300
transition"
              onClick={() => setConfirmPopup({ open: true })}
            >
              Report
            </button>
          </div>
        </>
      </div>
      {calling && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
          <div
            className="bg-gradient-to-br from-[#161a23] to-[#0b0c10] 
      border border-white/10 rounded-2xl p-10 text-center shadow-2xl"
          >
            <div className="text-2xl font-semibold mb-4">
              📞 Calling {user?.name}...
            </div>

            <div className="text-gray-400 animate-pulse">
              Waiting for user to accept
            </div>

            <button
              onClick={async () => {
                if (callDocId) {
                  await updateDoc(doc(db, "calls", callDocId), {
                    status: "cancelled",
                  });
                }
                setCalling(false);
              }}
              className="mt-6 px-6 py-2 rounded-full bg-red-600 hover:bg-red-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {popup.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#161a23] via-[#0f1117] to-[#0b0c10] border border-yellow-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative">
            <div className="text-lg text-white mb-6">{popup.message}</div>
            <button
              className="mt-2 px-6 py-2 rounded-full bg-yellow-500/80 hover:bg-yellow-400/90 text-black font-semibold transition"
              onClick={() => {
                setPopup({ open: false, message: "" });
                const currentUser = getAuth().currentUser;
                navigate(`/dashboard/${currentUser.uid}`);
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {confirmPopup.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#161a23] via-[#0f1117] to-[#0b0c10] border border-red-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative">
            <div className="text-lg text-white mb-6">
              Are you sure you want to report this user?
            </div>
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-2 rounded-full bg-red-500/80 hover:bg-red-400/90 text-white font-semibold transition"
                onClick={async () => {
                  setConfirmPopup({ open: false });
                  try {
                    const res = await fetch(
                      `http://localhost:5000/user/${userId}/block`,
                      {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                      }
                    );
                    const data = await res.json();
                    if (res.ok) {
                      setPopup({
                        open: true,
                        message:
                          "User has been reported. You will no longer see their profile in matches.",
                      });
                    } else {
                      setPopup({
                        open: true,
                        message:
                          data.error ||
                          "User has been reported. You will no longer see their profile in matches.",
                      });
                    }
                  } catch (err) {
                    setPopup({
                      open: true,
                      message: "Error: " + err.message,
                    });
                  }
                }}
              >
                Yes, Report
              </button>
              <button
                className="px-6 py-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-semibold transition"
                onClick={() => setConfirmPopup({ open: false })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
