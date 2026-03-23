// sockets/chat.js
import { db, admin } from "../firebase.js";

const registerChatHandlers = (io, socket) => {
  const userId = socket.user.uid;

  socket.join(userId);
  console.log(`🟢 User joined room: ${userId}`);

  socket.on("sendMessage", async ({ receiverId, text }) => {
    console.log("📨 sendMessage received:", receiverId, text);
    try {
      if (!receiverId || !text?.trim()) return;

      // 1. Define chatId first
      const chatId = [userId, receiverId].sort().join("_");
      const timestamp = admin.firestore.FieldValue.serverTimestamp();

      const chatRef = db.collection("chats").doc(chatId);
      const messagesRef = chatRef.collection("messages");

      // 2. Fetch User Names (Optional but recommended for the list view)
      // This ensures your ChatList has names without extra API calls
      const [senderDoc, receiverDoc] = await Promise.all([
        db.collection("users").doc(userId).get(),
        db.collection("users").doc(receiverId).get(),
      ]);

      const senderName = senderDoc.exists ? senderDoc.data().name : "User";
      const receiverName = receiverDoc.exists ? receiverDoc.data().name : "User";

      // 3. Save the actual message
      const message = {
        senderId: userId,
        receiverId,
        text,
        seen: false,
        createdAt: timestamp,
      };
      await messagesRef.add(message);

      // 4. Update Chat Metadata (Now chatId is defined!)
      await chatRef.set(
        {
          participants: [userId, receiverId],
          lastMessage: text,
          lastSenderId: userId,
          updatedAt: timestamp,
          userNames: {
            [userId]: senderName,
            [receiverId]: receiverName,
          },
        },
        { merge: true }
      );

      // 5. Update user-specific chat lists (your previous logic)
      await Promise.all([
        db.collection("users").doc(receiverId).set(
          { chatUsers: admin.firestore.FieldValue.arrayUnion(userId) },
          { merge: true }
        ),
        db.collection("users").doc(userId).set(
          { chatUsers: admin.firestore.FieldValue.arrayUnion(receiverId) },
          { merge: true }
        ),
      ]);

      // 6. Emit to both rooms
      const payload = { chatId, ...message, createdAt: new Date().toISOString() };
      io.to(receiverId).emit("receiveMessage", payload);
      io.to(userId).emit("receiveMessage", payload);

    } catch (err) {
      console.error("Send message error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 User disconnected: ${userId}`);
  });
};

export default registerChatHandlers;