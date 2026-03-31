import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

// Route Imports
import signupRoute from "./routes/signup.js";
import loginRoute from "./routes/login.js";
import searchProfilesRoute from "./routes/searchProfiles.js";
import userRoute from "./routes/user.js";
import chatRoutes from "./routes/chat.js";
import registerChatHandlers from "./sockets/chat.js";
import socketAuth from "./sockets/socketAuth.js";
import agoraTokenRoute from "./routes/agoraToken.js";
import challengeRoutes from "./routes/challenge.js";
import sttRoute from "./routes/stt.js";
import translateRoute from "./routes/translate.js";


// import { startChallengeScheduler } from "./jobs/challengeScheduler.js";

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/signup", signupRoute);
app.use("/login", loginRoute);
app.use("/search-profiles", searchProfilesRoute);
app.use("/user", userRoute);
app.use("/chat", chatRoutes);
app.use("/api/agora", agoraTokenRoute);
app.use("/challenge", challengeRoutes);
app.use("/api/stt", sttRoute);
app.use("/api/translate", translateRoute);

// HTTP & Socket Server Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(socketAuth);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  
  registerChatHandlers(io, socket);

  socket.on("join-channel", (channelName) => {
    socket.join(channelName);
    console.log(`📢 User ${socket.id} joined Room: ${channelName}`);
  });

  // When a caption is sent from one user
  socket.on("caption-send", (data) => {
    console.log(`📝 Caption from ${data.userName} in ${data.channelName}: ${data.text}`);

    // BROADCAST: Send to everyone in the room EXCEPT the person who sent it
    socket.to(data.channelName).emit("caption-receive", {
      text: data.text, // Only send the caption text, without the user name
      senderId: data.senderId
    });
  });
  socket.on("call-status-update", (data) => {
    io.to(data.channelName).emit("call-status-update", data);
  });

 socket.on("disconnecting", () => {
  // socket.rooms is a Set of all rooms the user is currently in
  for (const room of socket.rooms) {
    if (room !== socket.id) {
      // Notify others in the room that this user left unexpectedly
      socket.to(room).emit("call-end");
    }
  }
});
});

// Start Services
server.listen(5000, () => {
  console.log("🚀 Know2Flow Backend running on port 5000");
});
