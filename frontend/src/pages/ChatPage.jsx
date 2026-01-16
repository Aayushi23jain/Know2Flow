import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { db } from "../firebase"; // your firebase.js
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

export default function ChatPage() {
  const { userId } = useParams(); // receiver
  const navigate = useNavigate();

  const [meUid, setMeUid] = useState(null);
  const [user, setUser] = useState(null); // chat user profile
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  /* ================= AUTH ================= */
  useEffect(() => {
    fetch("http://localhost:5000/user/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.userId && setMeUid(d.userId));
  }, []);

  /* ================= LOAD CHAT USER ================= */
  useEffect(() => {
    fetch(`http://localhost:5000/user/${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(setUser);
  }, [userId]);

  /* ================= SOCKET.IO ================= */
  useEffect(() => {
    if (!meUid) return;

    socketRef.current = io("http://localhost:5000", { withCredentials: true });



    return () => {
      socketRef.current.disconnect();
      socketRef.current = null;
    };
  }, [meUid]);

  /* ================= FIRESTORE CHAT ================= */
  useEffect(() => {
    if (!meUid) return;

    const chatId = [meUid, userId].sort().join("_");
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const msgs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [meUid, userId]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = () => {
  if (!text.trim()) return;

  socketRef.current.emit("sendMessage", {
    receiverId: userId,
    text: text.trim(),
  });

  setText("");
};


  /* ================= AUTOSCROLL ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b10] text-white">

      {/* HEADER */}
      <div className="h-14 flex items-center px-4 border-b border-white/10 justify-between">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}>←</button>
          <span className="ml-4 font-semibold">{user?.name || "Chat"}</span>
        </div>

        {/* <button
          onClick={clearChat}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500"
        >
          Clear Chat
        </button> */}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.map((m, i) => {
          const isMe = m.senderId === meUid;
          return (
            <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[65%] px-4 py-2 rounded-xl text-sm
                ${isMe
                  ? "bg-yellow-400 text-black rounded-br-none"
                  : "bg-gray-700 text-white rounded-bl-none"}`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="p-4 border-t border-white/10 flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 rounded-full px-4 py-2 bg-black/50 focus:outline-none"
        />
        <button
          onClick={sendMessage}
          className="px-5 rounded-full bg-yellow-400 text-black font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
}