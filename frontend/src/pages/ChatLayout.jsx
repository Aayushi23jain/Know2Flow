import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import React, { useState, useEffect } from "react";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

export default function ChatLayout() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatUsers, setChatUsers] = useState([]);
  const meUid = localStorage.getItem("userId"); // or from auth

  useEffect(() => {
    if (!meUid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", meUid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((doc) => {
        const data = doc.data();
        // find the other participant
        const otherUid = data.participants.find((uid) => uid !== meUid);
        return { uid: otherUid, name: data.userNames?.[otherUid] || "User" };
      });

      setChatUsers(users);
    });

    return () => unsubscribe();
  }, [meUid]);

  return (
    <div className="h-screen flex bg-[#0b0b10] text-white">
      
<div className="w-[30%] border-r border-white/10">
   <ChatList onSelectUser={(user) => setSelectedUser(user)} />
</div>
      <div className="flex-1">
        {selectedUser ? (
          <ChatWindow userId={selectedUser.uid} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}