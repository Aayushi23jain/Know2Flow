/* eslint-disable no-misleading-character-class */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updateDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { io } from "socket.io-client";

let AgoraRTC = null;

export default function VideoCall() {
  const navigate = useNavigate();
  const { channelName, callId } = useParams();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const myName = currentUser?.displayName || "User";

  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const clientRef = useRef(null);
  const localTracksRef = useRef(null);
  const socketRef = useRef(null);
  const botStartedRef = useRef(false);

  const [joined, setJoined] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [captions, setCaptions] = useState("");
  const [sttActive, setSttActive] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false); // Initially set to false
  const [otherUserId, setOtherUserId] = useState(null);

  const captionTimeoutRef = useRef(null);
  const captionsEnabledRef = useRef(false);
  const lastCaptionRef = useRef("");
  useEffect(() => {
    captionsEnabledRef.current = captionsEnabled;
  }, [captionsEnabled]);

  const APP_ID = import.meta.env.VITE_AGORA_APP_ID;
  const normalizeCaption = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097F\s]/gi, "") // remove symbols
      .replace(/\s+/g, " ")
      .trim();
  };

  const isSimilarCaption = (a, b) => {
    if (!a || !b) return false;

    const A = normalizeCaption(a);
    const B = normalizeCaption(b);

    return A === B || A.includes(B) || B.includes(A) || levenshtein(A, B) <= 2;
  };

  // small edit-distance helper
  const levenshtein = (a, b) => {
    const matrix = Array.from({ length: b.length + 1 }, () => []);

    for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] =
          b[i - 1] === a[j - 1]
            ? matrix[i - 1][j - 1]
            : Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
              );
      }
    }

    return matrix[b.length][a.length];
  };
  /* --- 1. SHARED CLEANUP LOGIC --- */
  const handleCleanup = async () => {
    if (localTracksRef.current) {
      localTracksRef.current.forEach((track) => {
        track.stop();
        track.close();
      });
      localTracksRef.current = null;
    }

    if (clientRef.current) {
      await clientRef.current.leave();
      clientRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  /* --- 2. GET OTHER USER ID --- */
  useEffect(() => {
    const fetchCallData = async () => {
      try {
        const snap = await getDoc(doc(db, "calls", callId));
        const data = snap.data();
        if (!data) return;

        const otherId = data.from === currentUser.uid ? data.to : data.from;
        setOtherUserId(otherId);
      } catch (err) {
        console.error("Error fetching call data:", err);
      }
    };

    fetchCallData();
  }, [callId, currentUser.uid]);

  /* --- 3. SOCKET.IO SETUP --- */
  useEffect(() => {
    if (!channelName) return;

    const socket = io("http://localhost:5000", { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket Connected:", socket.id);
      socket.emit("join-channel", channelName);
    });

    socket.on("caption-receive", (data) => {
      if (!captionsEnabledRef.current) return;

      setCaptions(data.text);

      if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
      captionTimeoutRef.current = setTimeout(() => setCaptions(""), 4000);
    });

    socket.on("call-end", async () => {
      console.log(
        "☎️ Remote user ended the call. Redirecting to their profile..."
      );
      await handleCleanup();
      if (otherUserId) navigate(`/profile/${otherUserId}`);
      else navigate(-1);
    });

    return () => {
      socket.disconnect();
    };
  }, [channelName, captionsEnabled, otherUserId]);

  /* --- 4. AGORA STT TRIGGER --- */
  const startSTTBot = async () => {
    if (botStartedRef.current) return;
    try {
      const callDoc = await getDoc(doc(db, "calls", callId));
      const callData = callDoc.data();

      if (callData.from !== currentUser.uid) {
        setSttActive(true);
        return;
      }

      botStartedRef.current = true;
      const response = await fetch("http://localhost:5000/api/stt/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelName }),
      });

      if (response.ok) setSttActive(true);
    } catch (err) {
      console.error("STT Trigger Error:", err);
      botStartedRef.current = false;
    }
  };

  /* --- 5. INITIALIZE AGORA --- */
  useEffect(() => {
    if (!APP_ID || !channelName) return;

    const initializeCall = async () => {
      try {
        const uid = Number(
          currentUser.uid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
        );

        if (!AgoraRTC) {
          const module = await import("agora-rtc-sdk-ng");
          AgoraRTC = module.default;
        }

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
        clientRef.current = client;

        client.on("stream-message", async (botUid, data) => {
          try {
            let text = new TextDecoder("utf-8", { fatal: false }).decode(data);

            // 🔥 STEP 1: REMOVE ZERO WIDTH + RTL MARKS (THIS FIXES ‏)
            text = text.replace(
              /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g,
              ""
            );

            // 🔥 STEP 2: REMOVE CONTROL CHARACTERS
            // eslint-disable-next-line no-control-regex
            text = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");

            // 🔥 STEP 3: REMOVE AGORA / STT JUNK WORDS
            text = text.replace(
              /\b(enus|hiin|transcribe\w*|caption|speech|zenus|agora|uid|jtranscribezen)\b/gi,
              " "
            );

            // 🔥 STEP 4: REMOVE SYMBOL CLUSTERS (-ZZ, 3R8, etc.)
            text = text.replace(/[-_]{2,}|[a-zA-Z]*\d+[a-zA-Z]*/g, " ");

            // 🔥 STEP 5: KEEP ONLY REAL TEXT
            // eslint-disable-next-line no-misleading-character-class
            text = text.replace(/[^a-zA-Z\u0900-\u097F\s]/g, " ");

            // 🔥 STEP 6: NORMALIZE SPACE
            text = text.replace(/\s+/g, " ").trim();

            // ❌ DROP BAD OUTPUT
            if (!text || text.length < 3) return;
            if (!/[a-zA-Z\u0900-\u097F]{3,}/.test(text)) return;

            // 🔥 STEP 7: DUPLICATE CHECK (STRONG)
            const norm = text.toLowerCase();
            if (norm === (lastCaptionRef.current || "")) return;
            lastCaptionRef.current = norm;

            // 🔥 STEP 8: TRANSLATION (FIXED FLOW)
            // 🔥 STEP 8: TRANSLATION (FIXED FLOW)
            let finalText = text;

            const isHindi = /[\u0900-\u097F]/.test(text);
            const isEnglish = /^[a-zA-Z\s.,!?']+$/.test(text);

            try {
              if (text.length > 2 && (isHindi || isEnglish)) {
                const res = await fetch("http://localhost:5000/api/translate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ text }),
                });

                const data = await res.json();

                if (data?.translated && data.translated.trim().length > 0) {
                  finalText = data.translated;
                }
              }
            } catch (e) {
              console.error("Translation error:", e);
            }

            finalText = finalText
              .replace(/\b(en|hi|us|in|j)\b/gi, "")
              .replace(/‏|‎/g, "") // removes RTL marks
              .replace(/\s+/g, " ")
              .trim();
            if (!finalText || finalText.length < 2) return;
            if (finalText === captions) return;

            setCaptions(finalText);

            if (captionTimeoutRef.current)
              clearTimeout(captionTimeoutRef.current);

            captionTimeoutRef.current = setTimeout(() => {
              setCaptions("");
            }, 3000);

            socketRef.current?.emit("caption-send", {
              channelName,
              userName: myName,
              text: finalText,
            });
          } catch (err) {
            console.error("caption error:", err);
          }
        });
        const tokenRes = await fetch(
          "http://localhost:5000/api/agora/generate-token",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channelName, uid }),
          }
        );
        const { token } = await tokenRes.json();

        await client.join(APP_ID, channelName, token, uid);

        const [audioTrack, videoTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks(
            { AEC: true, ANS: false, AGC: true },
            { encoderConfig: "720p_1" }
          );
        localTracksRef.current = [audioTrack, videoTrack];

        videoTrack.play(localRef.current);
        await client.publish([audioTrack, videoTrack]);

        setJoined(true);
        setTimeout(() => startSTTBot(), 5000);

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video") user.videoTrack.play(remoteRef.current);
          if (mediaType === "audio") user.audioTrack.play();
        });
      } catch (err) {
        console.error("Call Init Error:", err);
      }
    };

    initializeCall();
    return () => {
      handleCleanup();
    };
  }, [APP_ID, channelName]);

  /* --- 6. FIRESTORE LISTENER (IN CASE REMOTE ENDS CALL) --- */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "calls", callId), (snap) => {
      const data = snap.data();
      if (data?.status === "ended") {
        const otherId = data.from === currentUser.uid ? data.to : data.from;
        handleCleanup();
        navigate(`/profile/${otherId}`);
      }
    });
    return () => unsub();
  }, [callId]);

  /* --- 7. HELPERS & UI --- */
  useEffect(() => {
    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => new Date(s * 1000).toISOString().substr(11, 8);

  const endCall = async () => {
    socketRef.current?.emit("call-end", { channelName });
    if (callId) await updateDoc(doc(db, "calls", callId), { status: "ended" });
    await handleCleanup();
    if (otherUserId) navigate(`/profile/${otherUserId}`);
    else navigate(-1);
  };

  return (
    <div className="h-screen w-screen bg-black text-white relative overflow-hidden">
      <div ref={remoteRef} className="w-full h-full bg-gray-950" />

      <div className="absolute top-0 w-full p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <h2 className="text-xl font-bold">Know2Flow</h2>
          <p className="text-xs text-green-400">
            {sttActive ? "● Live Captions Active" : "○ Initializing..."}
          </p>
        </div>
        <div className="bg-white/10 px-4 py-1 rounded-full font-mono">
          {formatTime(callDuration)}
        </div>
      </div>

      <div className="absolute bottom-32 right-8 w-48 h-64 bg-gray-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <div ref={localRef} className="w-full h-full object-cover" />
      </div>

      <div className="absolute bottom-44 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-2xl text-center px-4">
        {captionsEnabled && captions?.length > 0 && (
          <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20 inline-block shadow-xl">
            <p className="text-white text-lg font-medium">{captions}</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 w-full flex justify-center items-center gap-6 py-4">
        <button
          onClick={() => {
            localTracksRef.current[0].setEnabled(!micOn);
            setMicOn(!micOn);
          }}
          className={`p-5 rounded-full ${micOn ? "bg-white/10" : "bg-red-600"}`}
        >
          {micOn ? "🎙️" : "🔇"}
        </button>

        <button
          onClick={() => {
            localTracksRef.current[1].setEnabled(!cameraOn);
            setCameraOn(!cameraOn);
          }}
          className={`p-5 rounded-full ${
            cameraOn ? "bg-white/10" : "bg-red-600"
          }`}
        >
          {cameraOn ? "📷" : "🚫"}
        </button>

        <button
          onClick={() => {
            setCaptionsEnabled((prev) => {
              if (prev === true) setCaptions("");
              return !prev;
            });
          }}
          className={`p-5 rounded-full font-bold ${
            captionsEnabled ? "bg-green-500" : "bg-gray-600"
          }`}
        >
          CC
        </button>

        <button
          onClick={endCall}
          className="p-6 rounded-full bg-red-600 hover:scale-110 transition-transform"
        >
          ❌
        </button>
      </div>
    </div>
  );
}
