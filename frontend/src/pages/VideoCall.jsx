import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";

let AgoraRTC = null;

export default function VideoCall() {
  const navigate = useNavigate();
  const { channelName, callId } = useParams();

  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const clientRef = useRef(null);
  const localTracksRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [error, setError] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

  /* ---------------- CALL TIMER ---------------- */
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  /* ---------------- TOGGLE MIC ---------------- */
  const toggleMic = async () => {
    if (!localTracksRef.current) return;
    const audioTrack = localTracksRef.current[0];
    await audioTrack.setEnabled(!micOn);
    setMicOn(!micOn);
  };

  /* ---------------- TOGGLE CAMERA ---------------- */
  const toggleCamera = async () => {
    if (!localTracksRef.current) return;
    const videoTrack = localTracksRef.current[1];
    await videoTrack.setEnabled(!cameraOn);
    setCameraOn(!cameraOn);
  };

  /* ---------------- END CALL ---------------- */
  const endCall = async () => {
    try {
      if (localTracksRef.current) {
        localTracksRef.current[0]?.close();
        localTracksRef.current[1]?.close();
      }

      if (clientRef.current) {
        await clientRef.current.leave();
      }

      const callDocRef = doc(db, "calls", callId);
      const callSnap = await getDoc(callDocRef);
      const data = callSnap.data();

      const auth = getAuth();
      const currentUserId = auth.currentUser.uid;

      const otherUserId =
        data.from === currentUserId
          ? data.to
          : data.from;

      await updateDoc(callDocRef, { status: "ended" });

      navigate(`/profile/${otherUserId}`);
    } catch (err) {
      console.error("Error ending call:", err);
    }
  };

  /* ---------------- INITIALIZE CALL ---------------- */
  useEffect(() => {
    if (!APP_ID || !channelName) {
      setError("Missing Agora App ID or Channel Name");
      return;
    }

    let isMounted = true;
    let client;

    const initializeCall = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          throw new Error("User not authenticated");
        }

        const uid = Number(
          currentUser.uid
            .split("")
            .reduce((acc, c) => acc + c.charCodeAt(0), 0)
        );

        if (!AgoraRTC) {
          const module = await import("agora-rtc-sdk-ng");
          AgoraRTC = module.default;
        }

        if (clientRef.current) return;

        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        await client.enableDualStream();
        client.setClientRole("host");
        clientRef.current = client;

        const response = await fetch(
          "http://localhost:5000/api/agora/generate-token",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channelName,
              uid,
            }),
          }
        );

        const { token } = await response.json();

        const joinedUid = await client.join(
          APP_ID,
          channelName,
          token,
          uid
        );

        console.log("Joined with UID:", joinedUid);

        client.on("user-published", async (user, mediaType) => {
  await client.subscribe(user, mediaType);

  if (mediaType === "video") {
    user.videoTrack.play(remoteRef.current);
  }

  if (mediaType === "audio") {
    user.audioTrack.play();
  }
});


       const tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
  {
    encoderConfig: "music_standard",
    AEC: true,
    AGC: true,
    ANS: true,
  },
  {
    encoderConfig: {
      width: 640,
      height: 480,
      frameRate: 24,
      bitrateMin: 600,
      bitrateMax: 1500,
    },
  }
);

        localTracksRef.current = tracks;

        await client.publish(tracks);

        tracks[1].play(localRef.current);

        client.on("user-published", async (user, mediaType) => {
  await client.subscribe(user, mediaType);

  if (mediaType === "video" && user.videoTrack) {
    remoteRef.current.innerHTML = ""; // clear old
    user.videoTrack.play(remoteRef.current);
  }

  if (mediaType === "audio" && user.audioTrack) {
    user.audioTrack.play();
  }
});


        client.on("user-unpublished", (user, mediaType) => {
  if (mediaType === "video") {
    remoteRef.current.innerHTML = "";
  }
});


      } catch (err) {
        console.error("Error initializing call:", err);
        setError(err.message || "Failed to start video call");
      }
    };

    initializeCall();

    return async () => {
      if (!isMounted) return;
      isMounted = false;

      try {
        if (localTracksRef.current) {
          localTracksRef.current[0]?.close();
          localTracksRef.current[1]?.close();
        }

        if (clientRef.current) {
          await clientRef.current.leave();
          clientRef.current.removeAllListeners();
          clientRef.current = null;
        }
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    };
  }, [APP_ID, channelName]);

  /* ---------------- FIREBASE LISTENER ---------------- */
  useEffect(() => {
    if (!callId) return;

    const callDocRef = doc(db, "calls", callId);
    const unsubscribe = onSnapshot(callDocRef, (docSnap) => {
      const data = docSnap.data();

      if (data?.status === "ended") {
        const auth = getAuth();
        const currentUserId = auth.currentUser.uid;

        const otherUserId =
          data.from === currentUserId
            ? data.to
            : data.from;

        navigate(`/profile/${otherUserId}`);
      }
    });

    return () => unsubscribe();
  }, [callId]);

  return (
  <div className="h-screen w-screen bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">

    {/* Remote Video */}
    <div className="absolute inset-0">
      {error ? (
        <div className="h-full flex items-center justify-center text-red-400 text-lg font-semibold">
          {error}
        </div>
      ) : (
        <div
          ref={remoteRef}
          className="w-full h-full bg-black object-cover"
        />
      )}
    </div>

    {/* Top Bar */}
    <div className="absolute top-0 w-full px-8 py-5 flex justify-between items-center 
      bg-gradient-to-b from-black/80 to-transparent backdrop-blur-md">

      <div className="flex flex-col">
        <span className="text-lg font-semibold tracking-wide">
          Know2Flow
        </span>
        <span className="text-xs text-gray-400">
          Secure Video Call
        </span>
      </div>

      <div className="bg-white/10 px-4 py-1 rounded-full text-sm font-mono tracking-wider">
        {formatTime(callDuration)}
      </div>
    </div>

    {/* Local Video (Picture-in-Picture) */}
    <div className="absolute bottom-32 right-8 w-44 h-64 
      bg-gray-900/60 backdrop-blur-lg 
      rounded-2xl overflow-hidden border border-white/10 
      shadow-2xl transition-all duration-300 hover:scale-105">

      <div ref={localRef} className="w-full h-full object-cover" />
    </div>

    {/* Bottom Controls */}
    <div className="absolute bottom-0 w-full py-8 flex justify-center items-center gap-8
      bg-gradient-to-t from-black/90 to-transparent backdrop-blur-md">

      {/* Mic Button */}
      <button
        onClick={toggleMic}
        className={`w-16 h-16 rounded-full flex items-center justify-center 
        text-xl transition-all duration-300 shadow-lg
        ${micOn
          ? "bg-white/10 hover:bg-white/20"
          : "bg-red-600 hover:bg-red-700 scale-110"
        }`}
      >
        🎤
      </button>

      {/* Camera Button */}
      <button
        onClick={toggleCamera}
        className={`w-16 h-16 rounded-full flex items-center justify-center 
        text-xl transition-all duration-300 shadow-lg
        ${cameraOn
          ? "bg-white/10 hover:bg-white/20"
          : "bg-red-600 hover:bg-red-700 scale-110"
        }`}
      >
        📷
      </button>

      {/* End Call Button */}
      <button
        onClick={endCall}
        className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 
        flex items-center justify-center text-2xl 
        shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
      >
        ❌
      </button>
    </div>
  </div>
);
}
