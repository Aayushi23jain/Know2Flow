import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  // getDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { createSocket } from "../utils/socketClient";
import { useRef } from "react";
export default function IncomingCallPopup() {
  const [incomingCall, setIncomingCall] = useState(null);
  const [callerName, setCallerName] = useState("Unknown");
  const socketRef = useRef(null);
  const [callerPhoto, setCallerPhoto] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();
  const auth = getAuth();

  // ✅ Track logged-in user
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    console.log("Current user:", currentUser);

    return () => unsubscribeAuth();
  }, [auth]);
useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;
    return () => socket.disconnect();
  }, []);
  useEffect(() => {
  console.log("Current user:", currentUser);
}, [currentUser]);

  // ✅ Listen for incoming calls
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
  collection(db, "calls"),
  where("to", "==", currentUser.uid),
  where("status", "==", "ringing"),
  where("createdAt", ">", new Date(Date.now() - 30000)) // only last 30 seconds
);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        setIncomingCall(null);
        return;
      }

      const docSnap = snapshot.docs[0];
      const callData = { id: docSnap.id, ...docSnap.data() };
      console.log("CALL DATA:", callData);

      // 🔴 AUTO REMOVE POPUP IF CALL CANCELLED OR REJECTED
      if (
        callData.status === "cancelled" ||
        callData.status === "rejected"
      ) {
        setIncomingCall(null);
        return;
      }

      // 🟢 Show popup only if ringing
      if (callData.status === "ringing") {
        setIncomingCall(callData);

        // make sure caller id exists
        console.log("CALL DATA:", callData);
setCallerName(callData.callerName || "Unknown");
setCallerPhoto(callData.callerPhoto || null);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ✅ Accept Call
  const acceptCall = async () => {
    if (!incomingCall) return;

    await updateDoc(doc(db, "calls", incomingCall.id), {
      status: "accepted",
    });

    navigate(`/video-call/${incomingCall.channelName}/${incomingCall.id}`);
    setIncomingCall(null);
  };

  // ❌ Reject Call
  const rejectCall = async () => {
    if (!incomingCall) return;

    try {
      // 1. Update Firebase
      await updateDoc(doc(db, "calls", incomingCall.id), {
        status: "rejected",
      });

      // 2. Notify Chat via Socket
      if (socketRef.current) {
        socketRef.current.emit("call-status-update", {
          channelName: incomingCall.channelName,
          status: "rejected",
          message: "Video call rejected",
          senderName: currentUser?.displayName || "User"
        });
      }

      setIncomingCall(null);
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  };

  if (!incomingCall) return null;
  
  return (
    <div className="fixed bottom-6 right-6 bg-gray-900 p-6 rounded-xl text-white z-50 shadow-xl w-80">
      <div className="flex items-center gap-3">
        {callerPhoto ? (
          <img
            src={callerPhoto}
            className="w-14 h-14 rounded-full object-cover"
            alt="Caller"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
            👤
          </div>
        )}

        <div>
          <p className="text-lg font-semibold">{callerName}</p>
          <p className="text-sm text-gray-400">
            Incoming video call...
          </p>
        </div>
      </div>

      <div className="flex gap-4 mt-5">
        <button
          onClick={acceptCall}
          className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 transition w-full"
        >
          Accept
        </button>

        <button
          onClick={rejectCall}
          className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition w-full"
        >
          Reject
        </button>
      </div>
    </div>
  );
}