import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

export default function ChatLayout() {
  // 1. DECLARE the variable here
  const [selectedUserId, setSelectedUserId] = useState(null); 
  const [chatUsers, setChatUsers] = useState([]);
  const meUid = localStorage.getItem("userId");

  useEffect(() => {
    if (!meUid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", meUid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((doc) => {
        const data = doc.data();
        const otherUid = data.participants.find((uid) => uid !== meUid);
        return { uid: otherUid, name: data.userNames?.[otherUid] || "User" };
      });
      setChatUsers(users);
    });

    return () => unsubscribe();
  }, [meUid]);

  return (
    <div className="h-screen flex bg-[#0b0b10] text-white">
      {/* Sidebar */}
      <div className="w-[30%] border-r border-white/10">
        {/* 2. USE the setter here */}
        <ChatList onSelectUser={(id) => setSelectedUserId(id)} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1">
        {/* 3. USE the variable here */}
        {selectedUserId ? (
          <ChatWindow userId={selectedUserId} key={selectedUserId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}