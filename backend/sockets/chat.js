// // sockets/chat.js
// import { db, admin } from "../firebase.js";

// const registerChatHandlers = (io, socket) => {
//   const userId = socket.user.uid;

//   // Join personal room
//   socket.join(userId);

//   socket.on("sendMessage", async ({ receiverId, text }) => {
//     try {
//       if (!text || !receiverId) return;

//       const chatId = [userId, receiverId].sort().join("_");

//       const message = {
//         senderId: userId,
//         receiverId,
//         text,
//         seen: false,
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       };

//       const chatRef = db.collection("chats").doc(chatId);

//       // Update chat meta
//       await chatRef.set(
//         {
//           participants: [userId, receiverId],
//           lastMessage: text,
//           updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//         },
//         { merge: true }
//       );

//       // Save message
//       await chatRef.collection("messages").add(message);

//       // Emit to receiver
//       io.to(receiverId).emit("receiveMessage", {
//         chatId,
//         ...message,
//       });

//       // Emit back to sender
//       socket.emit("receiveMessage", {
//         chatId,
//         ...message,
//       });
//     } catch (err) {
//       console.error("Send message error:", err.message);
//     }
//   });
// };

// export default registerChatHandlers;
// sockets/chat.js
import { db, admin } from "../firebase.js";

const registerChatHandlers = (io, socket) => {
  const userId = socket.user.uid;

  // Join personal room (VERY IMPORTANT)
  socket.join(userId);
  console.log(`🟢 User joined room: ${userId}`);

  socket.on("sendMessage", async ({ receiverId, text }) => {
    console.log("📨 sendMessage received:", receiverId, text);
    try {
      if (!receiverId || !text?.trim()) return;

      const chatId = [userId, receiverId].sort().join("_");
      const timestamp = admin.firestore.FieldValue.serverTimestamp();

      const chatRef = db.collection("chats").doc(chatId);
      const messagesRef = chatRef.collection("messages");

      const message = {
        senderId: userId,
        receiverId,
        text,
        seen: false,
        createdAt: timestamp,
      };

      // Save message
      const messageDoc = await messagesRef.add(message);

      // Update chat metadata
      await chatRef.set(
        {
          participants: [userId, receiverId],
          lastMessage: text,
          lastSenderId: userId,
          updatedAt: timestamp,
        },
        { merge: true }
      );

      // Emit to receiver
io.to(receiverId).emit("receiveMessage", {
  chatId,
  ...message,
});

// Emit to sender using room (clean)
io.to(userId).emit("receiveMessage", {
  chatId,
  ...message,
});

    } catch (err) {
      console.error("Send message error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 User disconnected: ${userId}`);
  });
};

export default registerChatHandlers;
