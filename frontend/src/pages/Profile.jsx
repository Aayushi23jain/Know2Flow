import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { startCall } from "../utils/callService";

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
  const [requestSent, setRequestSent] = useState(false);
  const [waitingEnd, setWaitingEnd] = useState(false);
  const [hasReceivedRequest, setHasReceivedRequest] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false);

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(1)
    : null;

  const handleVideoCall = async () => {
    console.log("In video call handle");
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

      const callId = await startCall(
        currentUser.uid,
        userId,
        currentUser.displayName || "User",
        currentUser.photoURL || null
      );

      setCallDocId(callId);
      setCalling(true);

      const callRef = doc(db, "calls", callId);

      const unsubscribe = onSnapshot(callRef, (docSnap) => {
        const data = docSnap.data();

        if (data?.status === "accepted") {
          setCalling(false);
          navigate(`/video-call/${data.channelName}/${callId}`);
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

  // Fetch feedbacks
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
      .catch((err) => console.error("Failed to fetch feedbacks:", err))
      .finally(() => setLoadingFeedbacks(false));
  }, [userId]);

  // Main user + session useEffect
  useEffect(() => {
    setLoading(true);
    setError(null);

    const auth = getAuth();
    let unsubscribeFirestore = null;

    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) return;

      const currentRef = doc(db, "users", currentUser.uid);

      unsubscribeFirestore = onSnapshot(currentRef, (snap) => {
        if (!snap.exists()) return;

        const data = snap.data();

        const sentRequests = data.sentRequests || [];
        const receivedRequests = data.receivedRequests || [];
        const activeSessions = data.activeSessions || [];
        const sessionEndCount = data.sessionEndCount || {};

        setSessionActive(false);
        setHasReceivedRequest(false);
        setRequestSent(false);
        setWaitingEnd(false);

        if (activeSessions.includes(userId)) {
          setSessionActive(true);

          const sessionEndInitiator = data.sessionEndInitiator || {};

          if (activeSessions.includes(userId)) {
            setSessionActive(true);

            if (
              sessionEndCount[userId] === 1 &&
              sessionEndInitiator[userId] === currentUser.uid
            ) {
              setWaitingEnd(true);
            }
          }
        } else if (receivedRequests.includes(userId)) {
          setHasReceivedRequest(true);
        } else if (sentRequests.includes(userId)) {
          setRequestSent(true);
        }
      });
    });

    fetch(`http://localhost:5000/user/${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error("User not found");
        return r.json();
      })
      .then((data) => setUser(data))
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));

    return () => unsubscribeAuth();
  }, [userId]);

  const handleSendRequest = async () => {
    try {
      const currentUser = getAuth().currentUser;

      if (!currentUser) {
        alert("You must be logged in");
        return;
      }

      if (currentUser.uid === userId) {
        alert("You cannot send request to yourself");
        return;
      }

      const senderRef = doc(db, "users", currentUser.uid);
      const receiverRef = doc(db, "users", userId);

      const senderSnap = await getDoc(senderRef);

      if (!senderSnap.exists()) {
        alert("Sender data not found");
        return;
      }

      const senderData = senderSnap.data();
      const sentCount = senderData.sentRequestCount || 0;
      const sentRequests = senderData.sentRequests || [];

      if (sentRequests.includes(userId)) {
        setRequestSent(true);
        alert("Request already sent");
        return;
      }

      if (sentCount >= 1) {
        alert("You can send only one request at a time");
        return;
      }

      await updateDoc(receiverRef, {
        receivedRequests: arrayUnion(currentUser.uid),
      });

      await updateDoc(senderRef, {
        sentRequests: arrayUnion(userId),
        sentRequestCount: sentCount + 1,
      });

      setRequestSent(true);
      alert("Request sent successfully!");
    } catch (error) {
      console.error(error);
      alert("Error sending request: " + error.message);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      const currentUser = getAuth().currentUser;

      if (!currentUser) {
        alert("Login required");
        return;
      }

      const receiverRef = doc(db, "users", currentUser.uid);
      const senderRef = doc(db, "users", userId);

      const receiverSnap = await getDoc(receiverRef);
      const senderSnap = await getDoc(senderRef);

      if (!receiverSnap.exists() || !senderSnap.exists()) {
        alert("User data not found");
        return;
      }

      const receiverData = receiverSnap.data();
      const senderData = senderSnap.data();

      const receiverTokens = receiverData.tokens || 0;
      const senderTokens = senderData.tokens || 0;

      if (receiverTokens < 1 || senderTokens < 1) {
        alert("Not enough tokens");
        return;
      }

      await updateDoc(receiverRef, {
        tokens: receiverTokens - 1,
        receivedRequests: arrayRemove(userId),
        activeSessions: arrayUnion(userId),
      });

      await updateDoc(senderRef, {
        tokens: senderTokens - 1,
        sentRequests: arrayRemove(currentUser.uid),
        activeSessions: arrayUnion(currentUser.uid),
      });

      setSessionActive(true);
      setHasReceivedRequest(false);
      setRequestSent(false);

      alert("Session started!");
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    }
  };

  const handleEndSession = async () => {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) return;

      const currentRef = doc(db, "users", currentUser.uid);
      const otherRef = doc(db, "users", userId);

      const currentSnap = await getDoc(currentRef);
      const otherSnap = await getDoc(otherRef);

      const currentData = currentSnap.data();
      const otherData = otherSnap.data();

      const currentEnd = currentData.sessionEndCount || {};
      const currentCount = currentEnd[userId] || 0;

      if (currentCount === 0) {
        await updateDoc(currentRef, {
          [`sessionEndCount.${userId}`]: 1,
          [`sessionEndInitiator.${userId}`]: currentUser.uid,
        });

        await updateDoc(otherRef, {
          [`sessionEndCount.${currentUser.uid}`]: 1,
          [`sessionEndInitiator.${currentUser.uid}`]: currentUser.uid,
        });

        setWaitingEnd(true);
        return;
      }

      const currentTokens = currentData.tokens || 0;
      const otherTokens = otherData.tokens || 0;

      await updateDoc(currentRef, {
        tokens: currentTokens + 1,
        activeSessions: arrayRemove(userId),
        [`sessionEndCount.${userId}`]: 0,
        [`sessionEndInitiator.${userId}`]: "",
      });

      await updateDoc(otherRef, {
        tokens: otherTokens + 1,
        activeSessions: arrayRemove(currentUser.uid),
        [`sessionEndCount.${currentUser.uid}`]: 0,
        [`sessionEndInitiator.${currentUser.uid}`]: "",
      });

      setSessionActive(false);
      setWaitingEnd(false);

      alert("Session ended & tokens returned!");
    } catch (error) {
      console.error(error);
      alert("Error ending session");
    }
  };

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

          {/* Average star rating in header */}
          <div className="flex items-center gap-1 ml-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-2xl ${
                  star <= Math.round(avgRating) ? "text-yellow-400" : "text-gray-500"
                }`}
              >
                ★
              </span>
            ))}
            {avgRating ? (
              <span className="ml-2 text-sm text-gray-400">{avgRating} / 5</span>
            ) : (
              <span className="ml-2 text-sm text-gray-500">No ratings yet</span>
            )}
          </div>

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
                <span key={i} className="bg-gray-800/80 px-3 py-1 rounded-full text-sm">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-300">Learn Skills</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(user.learnSkills || []).map((s, i) => (
                <span key={i} className="bg-gray-800/80 px-3 py-1 rounded-full text-sm">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Feedbacks section */}
          <div className="mt-8">
            <h3 className="font-semibold text-gray-300 mb-3">Feedback Received</h3>
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
                        {fb.givenByName || "Anonymous"}
                      </div>
                      <div className="text-gray-200 mt-1">{fb.text}</div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 sm:mt-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            star <= fb.rating ? "text-yellow-400" : "text-gray-500"
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
                      className="cursor-pointer text-yellow-400 hover:text-orange-400 font-semibold transition"
                    >
                      {showAllFeedbacks
                        ? "Show Less"
                        : `+${feedbacks.length - 3} more feedbacks`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
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

              {sessionActive ? (
                <button
                  className="px-5 py-2 rounded-full
    bg-red-600/20 border border-red-400 text-red-300
    hover:bg-red-600/30 transition"
                  onClick={handleEndSession}
                  disabled={waitingEnd}
                >
                  {waitingEnd ? "Waiting..." : "End Session"}
                </button>
              ) : hasReceivedRequest ? (
                <button
                  className="px-5 py-2 rounded-full
    bg-green-600/20 border border-green-400 text-green-300
    hover:bg-green-600/30 transition"
                  onClick={handleAcceptRequest}
                >
                  Accept Request
                </button>
              ) : (
                <button
                  className={`px-5 py-2 rounded-full border transition
    ${
      requestSent
        ? "bg-gray-700 border-gray-500 text-gray-300 cursor-not-allowed"
        : "bg-gradient-to-r from-yellow-400/15 to-orange-400/15 border-yellow-400/30 text-white-300 hover:from-yellow-400/25 hover:to-orange-400/25 hover:text-yellow-200"
    }`}
                  onClick={handleSendRequest}
                  disabled={requestSent}
                >
                  {requestSent ? "Requested" : "Send Request"}
                </button>
              )}

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
                    setPopup({ open: true, message: "Error: " + err.message });
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
