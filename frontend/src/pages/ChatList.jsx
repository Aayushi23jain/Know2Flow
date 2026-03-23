import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

export default function ChatList({ onSelectUser }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const meUid = localStorage.getItem("userId");

  useEffect(() => {
    if (!meUid) return;

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
              key={chat.chatId}
              onClick={() => onSelectUser({ uid: chat.otherUserId, name: chat.name })}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-all border border-transparent hover:border-white/10 group"
            >
              {/* Avatar Placeholder */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500/20 to-yellow-500/20 flex items-center justify-center text-orange-400 font-bold border border-orange-500/20">
                {chat.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-gray-200 truncate group-hover:text-yellow-400 transition-colors">
                    {chat.name}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {chat.lastMessage}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}