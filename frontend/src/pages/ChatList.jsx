import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

export default function ChatList({ onSelectUser }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const meUid = localStorage.getItem("userId");

  useEffect(() => {
    if (!meUid) return;
    const currentUid = localStorage.getItem("userId"); // e.g., "F1VW1FZQ5TNzFHhQMjx2jW6OZPt2"
  if (!currentUid) return;
    // 1. Listen for chats where the logged-in user is a participant
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", meUid),
      orderBy("updatedAt", "desc") // Latest chats at the top
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Find the ID of the person you are talking to
        const otherUserId = data.participants.find((id) => id !== meUid);
        
        return {
          chatId: doc.id,
          otherUserId,
          // Use the userNames map from Firestore (saves API calls!)
          name: data.userNames?.[otherUserId] || "User",
          lastMessage: data.lastMessage || "Click to start chatting",
          updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
        };
      });
      
      setChats(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching chats:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [meUid]);

  if (loading) return <div className="p-4 text-gray-400">Loading chats...</div>;

  return (
    <div className="h-full flex flex-col bg-[#0b0b10]">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xl font-bold text-orange-400">Messages</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chats.length === 0 ? (
          <div className="text-center mt-10 text-gray-500 text-sm">
            No conversations yet.
          </div>
        ) : (
          chats.map((chat) => (
  <div 
    key={chat.chatId} // Changed from chat.id to chat.chatId to match your state
    onClick={() => onSelectUser(chat.otherUserId)} // Use the prop passed to the component
    className="flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer border-b border-white/5"
  >
    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
      {/* FIX: Use chat.name instead of chat.chatName */}
      {chat.name ? chat.name.charAt(0) : "?"}
    </div>
    <div className="flex-1">
      <div className="flex justify-between">
        <h4 className="font-bold text-white">{chat.name}</h4>
        <span className="text-[10px] text-gray-500">
          {/* FIX: chat.updatedAt is already a Date object from your useEffect logic */}
          {chat.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p className="text-sm text-gray-400 truncate">{chat.lastMessage}</p>
    </div>
  </div>
))
        )}
      </div>
    </div>
  );
}