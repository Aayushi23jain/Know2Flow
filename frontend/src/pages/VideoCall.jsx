import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { io } from "socket.io-client";

let AgoraRTC = null;

export default function VideoCall() {
  const navigate = useNavigate();
  const { channelName, callId } = useParams();
  const [showCaptions, setShowCaptions] = useState(true);
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const clientRef = useRef(null);
  const localTracksRef = useRef(null);
  
  const [joined, setJoined] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [error, setError] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [captions, setCaptions] = useState("");
  
  const auth = getAuth();
  const socketRef = useRef(null);
  const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

  /* ---------------- SOCKET SETUP ---------------- */
  useEffect(() => {
    if (!channelName) return;
    const socket = io("http://localhost:5000", { withCredentials: true });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("join-channel", channelName));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [channelName]);

  /* ---------------- CALL TIMER ---------------- */
  useEffect(() => {
    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const toggleMic = async () => {
    if (!localTracksRef.current) return;
    await localTracksRef.current[0].setEnabled(!micOn);
    setMicOn(!micOn);
  };

  const toggleCamera = async () => {
    if (!localTracksRef.current) return;
    await localTracksRef.current[1].setEnabled(!cameraOn);
    setCameraOn(!cameraOn);
  };

  const endCall = async () => {
    try {
      if (localTracksRef.current) {
        localTracksRef.current[0]?.close();
        localTracksRef.current[1]?.close();
      }
      if (clientRef.current) {
        await clientRef.current.leave();
        setJoined(false);
      }
      const callDocRef = doc(db, "calls", callId);
      await updateDoc(callDocRef, { status: "ended" });
    } catch (err) {
      console.error("Error ending call:", err);
    }
  };

  /* ---------------- INITIALIZE CALL & AGORA RTT LISTENER ---------------- */
  useEffect(() => {
    if (!APP_ID || !channelName) return;

    const initializeCall = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("User not authenticated");

        const uid = Number(currentUser.uid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0));

        if (!AgoraRTC) {
          const module = await import("agora-rtc-sdk-ng");
          AgoraRTC = module.default;
        }

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
        clientRef.current = client;

        // 1. Get Token
        const response = await fetch("http://localhost:5000/api/agora/generate-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelName, uid }),
        });
        const { token } = await response.json();

        // 2. Join Channel
        await client.join(APP_ID, channelName, token, uid);
        // --- ADD THIS START RTT TRIGGER ---
try {
  await fetch("http://localhost:5000/api/agora/start-rtt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelName }),
  });
  console.log("✅ RTT Service Started");
} catch (rttErr) {
  console.error("Failed to start RTT service:", rttErr);
}
        // 3. LISTEN FOR AGORA RTT MESSAGES
        client.on("stream-message", (uid, data) => {
          const decoder = new TextDecoder("utf-8");
          const decodedData = decoder.decode(data);
          
          try {
            // Agora RTT usually sends a JSON string or Protobuf
            // Adjust this parsing based on your backend RTT 'start' config
            const textData = JSON.parse(decodedData);
           const finalChat = textData.transcription?.texts?.[0]?.text || 
                     textData.words?.[0]?.text || 
                     decodedData;
                     
    setCaptions(finalChat);
          } catch (e) {
            setCaptions(decodedData);
          }

          // Clear captions after 4 seconds of silence
          setTimeout(() => setCaptions(""), 4000);
        });

        // 4. Setup Local Tracks
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        localTracksRef.current = tracks;
        await client.publish(tracks);
        tracks[1].play(localRef.current);
        setJoined(true);

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video") user.videoTrack.play(remoteRef.current);
          if (mediaType === "audio") user.audioTrack.play();
        });

      } catch (err) {
        console.error("Call Init Error:", err);
        setError("Failed to connect to video service");
      }
    };

    initializeCall();
    return () => {
      if (clientRef.current) {
        clientRef.current.leave();
        clientRef.current.removeAllListeners();
      }
    };
  }, [APP_ID, channelName]);

  return (
    <div className="h-screen w-screen bg-black text-white relative">
      <div ref={remoteRef} className="absolute inset-0 w-full h-full" />
      
      {/* Captions UI */}
      {showCaptions && captions && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-black/70 px-6 py-2 rounded-xl border border-white/20">
            <p className="text-xl font-medium">{captions}</p>
          </div>
        </div>
      )}

      {/* Local Mini Video */}
      <div className="absolute bottom-32 right-8 w-40 h-56 rounded-xl overflow-hidden border border-white/20 shadow-xl">
        <div ref={localRef} className="w-full h-full object-cover" />
      </div>

      {/* Controls */}
      <div className="absolute bottom-10 w-full flex justify-center gap-6">
        <button onClick={() => setShowCaptions(!showCaptions)} className={`p-4 rounded-full ${showCaptions ? 'bg-blue-600' : 'bg-gray-700'}`}>CC</button>
        <button onClick={toggleMic} className="p-4 rounded-full bg-white/10">{micOn ? "🎙️" : "🔇"}</button>
        <button onClick={toggleCamera} className="p-4 rounded-full bg-white/10">{cameraOn ? "📷" : "🚫"}</button>
        <button onClick={endCall} className="p-4 rounded-full bg-red-600 px-8">End</button>
      </div>
    </div>
  );
}