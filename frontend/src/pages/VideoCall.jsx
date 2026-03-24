// import React, { useEffect, useRef, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
// import { db } from "../firebase";
// import { getAuth } from "firebase/auth";
// import { io } from "socket.io-client";

// let AgoraRTC = null;

// export default function VideoCall() {
//   const navigate = useNavigate();
//   const { channelName, callId } = useParams();

//   const localRef = useRef(null);
//   const remoteRef = useRef(null);
//   const clientRef = useRef(null);
//   const localTracksRef = useRef(null);
//   const lastTextRef = useRef("");
// // const [remoteUid, setRemoteUid] = useState(null);
//   const [joined, setJoined] = useState(false);
//   const [cameraOn, setCameraOn] = useState(true);
//   const [micOn, setMicOn] = useState(true);
//   const [error, setError] = useState(null);
//   const [callDuration, setCallDuration] = useState(0);
//   const [captions, setCaptions] = useState("");
//   const [listening, setListening] = useState(false);
// const auth = getAuth();

//   const currentUser = auth.currentUser;
//   const myName = currentUser?.displayName || "User"; // Now it's defined globally for this component
// const socketRef = useRef(null);
//   const APP_ID = import.meta.env.VITE_AGORA_APP_ID;
// // VideoCall.jsx
// useEffect(() => {
//   if (!channelName) return;

//   const socket = io("http://localhost:5000", { withCredentials: true });
//   socketRef.current = socket;

//   socket.on("connect", () => {
//     console.log("✅ Socket Connected:", socket.id);
//     socket.emit("join-channel", channelName);
//   });

//   // Listener logic
//   const handleReceive = (data) => {
//     const isMe = data.senderId === socket.id;
//     const name = isMe ? "You" : data.userName;
//     setCaptions(`${name}: ${data.text}`);
//   };

//   socket.on("caption-receive", handleReceive);

//   return () => {
//     // CRITICAL: Clean up the specific listener and the socket
//     socket.off("caption-receive", handleReceive);
//     socket.disconnect();
//     socketRef.current = null;
//   };
// }, [channelName]); // Only re-run if channelName changes
// useEffect(() => {
//   if (!channelName) return;

//   // ONE connection, not two!
//   const socket = io("http://localhost:5000", { withCredentials: true });
//   socketRef.current = socket;

//   socket.on("connect", () => {
//     console.log("✅ Single Socket Connected:", socket.id);
//     socket.emit("join-channel", channelName);
//   });

//   const handleReceive = (data) => {
//     // Check if the sender is NOT me
//     // We check against the current socket's actual ID
//     if (data.senderId === socket.id) {
//       console.log("☁️ Ignoring my own reflection");
//       return;
//     }

//     console.log("📩 Received from partner:", data);
//     setCaptions(`${data.userName}: ${data.text}`);

//     // const hideTimer = setTimeout(() => {
//     //   setCaptions("");
//     // }, 4000);
//   };

//   socket.on("caption-receive", handleReceive);

//   return () => {
//     socket.off("caption-receive", handleReceive);
//     socket.disconnect();
//     socketRef.current = null;
//   };
// }, [channelName]); // Keep this as the only dependency
//   /* ---------------- CALL TIMER ---------------- */
//   useEffect(() => {
//     const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   const formatTime = (seconds) => {
//     const h = Math.floor(seconds / 3600);
//     const m = Math.floor((seconds % 3600) / 60);
//     const s = seconds % 60;
//     return `${String(h).padStart(2, "0")}:${String(m).padStart(
//       2,
//       "0"
//     )}:${String(s).padStart(2, "0")}`;
//   };

//   /* ---------------- TOGGLE MIC ---------------- */
//   const toggleMic = async () => {
//     if (!localTracksRef.current) return;
//     const audioTrack = localTracksRef.current[0];
//     await audioTrack.setEnabled(!micOn);
//     setMicOn(!micOn);
//   };

//   /* ---------------- TOGGLE CAMERA ---------------- */
//   const toggleCamera = async () => {
//     if (!localTracksRef.current) return;
//     const videoTrack = localTracksRef.current[1];
//     await videoTrack.setEnabled(!cameraOn);
//     setCameraOn(!cameraOn);
//   };

//   /* ---------------- END CALL ---------------- */
//   const endCall = async () => {
//     try {
//       if (localTracksRef.current) {
//         localTracksRef.current[0]?.close();
//         localTracksRef.current[1]?.close();
//       }
//       if (clientRef.current) {
//         await clientRef.current.leave();
//         setJoined(false);
//       }

//       const callDocRef = doc(db, "calls", callId);
//       const callSnap = await getDoc(callDocRef);
//       const data = callSnap.data();
//       const auth = getAuth();
//       const currentUserId = auth.currentUser.uid;
//       const otherUserId = data.from === currentUserId ? data.to : data.from;
// // const myName = currentUser?.displayName || "User";
//       await updateDoc(callDocRef, { status: "ended" });
//       navigate(`/profile/${otherUserId}`);
//     } catch (err) {
//       console.error("Error ending call:", err);
//     }
//   };

//   /* ---------------- UPDATED SPEECH RECOGNITION ---------------- */
// useEffect(() => {
//   const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//   if (!SpeechRecognition || !joined) return;

//   const recognition = new SpeechRecognition();
//   recognition.continuous = true;
//   recognition.interimResults = true;

//   // Use a ref-like variable to track the last sent string within this effect
//   // let lastText = "";

//   recognition.onstart = () => {
//     setListening(true);
//     console.log("Captions active");
//   };

// // Inside your Speech Recognition useEffect
// recognition.onresult = (event) => {
//   const latestResultIndex = event.results.length - 1;
//   const transcript = event.results[latestResultIndex][0].transcript.trim();

//   // Use the REF here instead of a local variable
//   if (transcript !== lastTextRef.current && transcript !== "") {
//     lastTextRef.current= transcript; // Update the ref

//     if (socketRef.current?.connected) {
//       console.log("📤 Sending to Server:", transcript);
//       socketRef.current.emit("caption-send", {
//         channelName: channelName, // The User1_User2 string
//         text: transcript,
//         userName: myName
//       });
//     }
//   }
// };

//   recognition.onerror = (event) => {
//     console.error("Speech Error:", event.error);
//   };

//   recognition.onend = () => {
//     setListening(false);
//     // Restart logic: as long as the call is active, keep listening
//     if (joined) {
//       try {
//         recognition.start();
//       } catch (e) {
//         console.warn("Recognition restart attempt failed:", e);
//       }
//     }
//   };

//   recognition.start();

//   return () => {
//     recognition.onend = null; // Important: prevent restart loop on unmount
//     recognition.stop();
//   };
// }, [joined, channelName,myName]);
//   /* ---------------- INITIALIZE CALL ---------------- */
//   useEffect(() => {
//     if (!APP_ID || !channelName) {
//       setError("Missing Agora App ID or Channel Name");
//       return;
//     }

//     let client;
//     const initializeCall = async () => {
//       try {
//         const auth = getAuth();
//         const currentUser = auth.currentUser;
//         if (!currentUser) throw new Error("User not authenticated");

//         const uid = Number(
//           currentUser.uid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
//         );

//         if (!AgoraRTC) {
//           const module = await import("agora-rtc-sdk-ng");
//           AgoraRTC = module.default;
//         }
//         if (clientRef.current) return;

//         client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
//         clientRef.current = client;

//         const response = await fetch(
//           "http://localhost:5000/api/agora/generate-token",
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ channelName, uid }),
//           }
//         );
//         const { token } = await response.json();

//         await client.join(APP_ID, channelName, token, uid);

//         const tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
//           {
//             encoderConfig: "480p_1",
//             AEC: true,
//             AGC: true,
//             ANS: true,
//           },
//           {
//             encoderConfig: {
//               width: 1280,
//               height: 720,
//               frameRate: 30,
//               bitrateMin: 1200,
//               bitrateMax: 2500,
//             },
//           }
//         );

//         localTracksRef.current = tracks;
//         await client.publish(tracks);
//         tracks[1].play(localRef.current);
//         setJoined(true); // mark call ready

//         client.on("user-published", async (user, mediaType) => {
//   await client.subscribe(user, mediaType);

//   // ❗ VERY IMPORTANT
//   if (user.uid === client.uid) return;

//   if (mediaType === "video" && user.videoTrack) {
//     remoteRef.current.innerHTML = "";
//     user.videoTrack.play(remoteRef.current);
//   }

//   if (mediaType === "audio" && user.audioTrack) {
//     user.audioTrack.play();
//   }
// });

//         client.on("user-unpublished", (user) => {
//           if (user.videoTrack) remoteRef.current.innerHTML = "";
//         });
//       } catch (err) {
//         console.error("Error initializing call:", err);
//         setError(err.message || "Failed to start video call");
//       }
//     };

//     initializeCall();

//     return async () => {
//       try {
//         if (localTracksRef.current) {
//           localTracksRef.current[0]?.close();
//           localTracksRef.current[1]?.close();
//         }
//         if (clientRef.current) {
//           await clientRef.current.leave();
//           clientRef.current.removeAllListeners();
//           clientRef.current = null;
//         }
//       } catch (err) {
//         console.error("Cleanup error:", err);
//       }
//     };
//   }, [APP_ID, channelName]);

//   /* ---------------- FIREBASE LISTENER ---------------- */
//   useEffect(() => {
//     if (!callId) return;
//     const callDocRef = doc(db, "calls", callId);
//     const unsubscribe = onSnapshot(callDocRef, (docSnap) => {
//       const data = docSnap.data();
//       if (data?.status === "ended") {
//         const auth = getAuth();
//         const currentUserId = auth.currentUser.uid;
//         const otherUserId = data.from === currentUserId ? data.to : data.from;
//         navigate(`/profile/${otherUserId}`);
//       }
//     });
//     return () => unsubscribe();
//   }, [callId]);

//   return (
//     <div className="h-screen w-screen bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
//       {/* Remote Video */}
//       <div className="absolute inset-0">
//         {error ? (
//           <div className="h-full flex items-center justify-center text-red-400 text-lg font-semibold">
//             {error}
//           </div>
//         ) : (
//           <div
//             ref={remoteRef}
//             className="w-full h-full bg-black object-cover"
//           />
//         )}
//       </div>

//       {/* Top Bar */}
//       <div className="absolute top-0 w-full px-8 py-5 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
//         <div className="flex flex-col">
//           <span className="text-lg font-semibold tracking-wide">Know2Flow</span>
//           <span className="text-xs text-gray-400">Secure Video Call</span>
//         </div>
//         <div className="bg-white/10 px-4 py-1 rounded-full text-sm font-mono tracking-wider">
//           {formatTime(callDuration)}
//         </div>
//       </div>

//       {/* Status */}
//       <div className="absolute top-20 left-8 px-4 py-2 bg-black/50 rounded-lg text-sm">
//         {joined ? "✅ Joined" : "❌ Not Joined"} |{" "}
//         {listening ? "🎙️ Listening" : "🛑 Not Listening"}
//       </div>

//       {/* Local Video (Picture-in-Picture) */}
//       <div className="absolute bottom-32 right-8 w-44 h-64 bg-gray-900/60 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 hover:scale-105">
//         <div ref={localRef} className="w-full h-full object-cover" />
//       </div>
// {/* Captions Box */}
// <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none">
//   {captions && (
//     <div className="bg-black/80 px-6 py-3 rounded-xl border border-white/20 shadow-2xl animate-pulse">
//        <p className="text-white text-lg font-medium">{captions}</p>
//     </div>
//   )}
// </div>

//       {/* Bottom Controls */}
//       <div className="absolute bottom-0 w-full py-8 flex justify-center items-center gap-8 bg-gradient-to-t from-black/90 to-transparent">
//         <button
//           onClick={toggleMic}
//           className={`w-16 h-16 rounded-full flex items-center justify-center text-xl transition-all duration-300 shadow-lg ${
//             micOn
//               ? "bg-white/10 hover:bg-white/20"
//               : "bg-red-600 hover:bg-red-700 scale-110"
//           }`}
//         >
//           🎤
//         </button>
//         <button
//           onClick={toggleCamera}
//           className={`w-16 h-16 rounded-full flex items-center justify-center text-xl transition-all duration-300 shadow-lg ${
//             cameraOn
//               ? "bg-white/10 hover:bg-white/20"
//               : "bg-red-600 hover:bg-red-700 scale-110"
//           }`}
//         >
//           📷
//         </button>
//         <button
//           onClick={endCall}
//           className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-2xl shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
//         >
//           ❌
//         </button>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
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

  // const formatTime = (seconds) => {
  //   const h = Math.floor(seconds / 3600);
  //   const m = Math.floor((seconds % 3600) / 60);
  //   const s = seconds % 60;
  //   return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  // };

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

        const uid = Number(
          currentUser.uid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
        );

        if (!AgoraRTC) {
          const module = await import("agora-rtc-sdk-ng");
          AgoraRTC = module.default;
        }

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
        clientRef.current = client;

        // 1. Get Token
        const response = await fetch(
          "http://localhost:5000/api/agora/generate-token",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channelName, uid }),
          }
        );
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
            const finalChat =
              textData.transcription?.texts?.[0]?.text ||
              textData.words?.[0]?.text ||
              decodedData;

            setCaptions(finalChat);
          } catch (e) {
            console.log(e);
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
        <button
          onClick={() => setShowCaptions(!showCaptions)}
          className={`p-4 rounded-full ${
            showCaptions ? "bg-blue-600" : "bg-gray-700"
          }`}
        >
          CC
        </button>
        <button onClick={toggleMic} className="p-4 rounded-full bg-white/10">
          {micOn ? "🎙️" : "🔇"}
        </button>
        <button onClick={toggleCamera} className="p-4 rounded-full bg-white/10">
          {cameraOn ? "📷" : "🚫"}
        </button>
        <button onClick={endCall} className="p-4 rounded-full bg-red-600 px-8">
          End
        </button>
      </div>
    </div>
  );
}
