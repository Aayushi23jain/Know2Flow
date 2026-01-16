import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/* ---------- CAMERA OFF PLACEHOLDER ---------- */
function VideoSkeleton({ label }) {
  return (
    <div className="w-full h-full flex items-center justify-center
      bg-gradient-to-br from-[#1f2933] to-[#0b0c10]">
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <div className="w-24 h-24 rounded-full
          bg-gradient-to-br from-gray-600 to-gray-800
          flex items-center justify-center
          text-3xl font-semibold text-gray-200">
          {label}
        </div>
        <div className="h-3 w-28 rounded bg-gray-700" />
      </div>
    </div>
  );
}

export default function VideoCall() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(s);
        if (localRef.current) {
          localRef.current.srcObject = s;
          localRef.current.muted = true;
        }
      } catch {
        setError("Camera or microphone access denied.");
      }
    }
    start();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  const toggleMic = () => {
    stream?.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
    setMicOn(v => !v);
  };

  const toggleCamera = () => {
    stream?.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
    setCameraOn(v => !v);
  };

  const endCall = () => {
    stream?.getTracks().forEach(t => t.stop());
    navigate(-1);
  };

  return (
    <div className="h-screen w-screen bg-black text-white relative overflow-hidden">

      {/* REMOTE VIDEO */}
      <div className="absolute inset-0">
        {error ? (
          <div className="h-full flex items-center justify-center text-red-400">
            {error}
          </div>
        ) : cameraOn ? (
          <video
            ref={remoteRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
          />
        ) : (
          <VideoSkeleton label={(userId || "U")[0].toUpperCase()} />
        )}
      </div>

      {/* SELF VIDEO (PIP) */}
      <div className="absolute bottom-28 right-6 w-40 h-56
        bg-gray-900 rounded-xl overflow-hidden border border-white/10">
        {cameraOn && stream ? (
          <video
            ref={localRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <VideoSkeleton label="Y" />
        )}
      </div>

      {/* TOP BAR */}
      <div className="absolute top-0 w-full px-6 py-4
        flex justify-between text-sm text-gray-300
        bg-gradient-to-b from-black/80 to-transparent">
        <span>Know2Flow • Video Call</span>
        <span>00:00</span>
      </div>

      {/* CONTROLS */}
      <div className="absolute bottom-0 w-full py-6
        flex justify-center gap-6
        bg-gradient-to-t from-black/80 to-transparent">

        {/* MIC */}
        <button onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center
          ${micOn ? "bg-gray-700" : "bg-red-600"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z"/>
            <path d="M19 11a7 7 0 01-14 0" fill="none" stroke="white" strokeWidth="2"/>
            <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="2"/>
          </svg>
        </button>

        {/* CAMERA */}
        <button onClick={toggleCamera}
          className={`w-14 h-14 rounded-full flex items-center justify-center
          ${cameraOn ? "bg-gray-700" : "bg-red-600"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <rect x="3" y="6" width="14" height="12" rx="2"/>
            <polygon points="17,10 22,7 22,17 17,14"/>
          </svg>
        </button>

        {/* END CALL */}
        <button onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M3 15c4-4 14-4 18 0"/>
          </svg>
        </button>

        {/* SCREEN SHARE */}
        <button className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <rect x="3" y="4" width="18" height="14" rx="2"/>
            <path d="M12 18v4" stroke="white" strokeWidth="2"/>
          </svg>
        </button>

       
      </div>
    </div>
  );
}
