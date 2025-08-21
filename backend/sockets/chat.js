
const userSocketMap = new Map(); // Firebase UID -> Socket ID

export default function registerChatHandlers(io, socket) {
  // Register user with their UID (frontend emits this after login)
  socket.on("register", (uid) => {
    userSocketMap.set(uid, socket.id);
    console.log(`User ${uid} registered with socket ${socket.id}`);
  });

  // Private messaging
  socket.on("private_message", ({ senderId, receiverId, message }) => {
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("private_message", {
        senderId,
        message,
        timestamp: new Date(),
      });
      console.log(`${senderId} → ${receiverId}: ${message}`);
    } else {
      console.log(`User ${receiverId} is not online.`);
    }
  });

  // Typing indicator
  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId });
    }
  });

  // Remove from map on disconnect
  socket.on("disconnect", () => {
    for (let [uid, sid] of userSocketMap) {
      if (sid === socket.id) {
        userSocketMap.delete(uid);
        console.log(`Removed ${uid} from userSocketMap`);
        break;
      }
    }
  });
}
