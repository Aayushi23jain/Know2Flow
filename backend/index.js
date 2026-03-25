// import dotenv from "dotenv";
// dotenv.config();

// import express from "express";
// import bodyParser from "body-parser";
// import cors from "cors";
// import http from "http";
// import { Server } from "socket.io";
// import cookieParser from "cookie-parser";

// import signupRoute from "./routes/signup.js";
// import loginRoute from "./routes/login.js";
// import searchProfilesRoute from "./routes/searchProfiles.js";
// import userRoute from "./routes/user.js";
// import chatRoutes from "./routes/chat.js";
// import registerChatHandlers from "./sockets/chat.js";
// import socketAuth from "./sockets/socketAuth.js";
// import agoraTokenRoute from "./routes/agoraToken.js";
// const app = express();

// app.use(cors({
//   origin: "http://localhost:5173",
//   credentials: true,
// }));
// app.use(bodyParser.json());
// app.use(cookieParser());

// // Routes
// app.use("/signup", signupRoute);
// app.use("/login", loginRoute);
// app.use("/search-profiles", searchProfilesRoute);
// app.use("/user", userRoute);
// app.use("/chat", chatRoutes);
// app.use("/api/agora", agoraTokenRoute);
// // HTTP server
// const server = http.createServer(app);

// // Socket.IO
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });
// io.use(socketAuth);
// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);
  
//   registerChatHandlers(io, socket);

//   socket.on("join-channel", (channelName) => {
//     socket.join(channelName);
//     console.log(`User ${socket.id} joined room: ${channelName}`);
    
//     // Optional: Tell the user they joined successfully
//     socket.emit("joined-success", channelName);
//   });

//   socket.on("caption-send", (data) => {
//     // Log this to see if data is actually reaching the server
//     console.log(`Caption from ${socket.id} to room ${data.channelName}: ${data.text}`);
    
//     // Broadcast to others in the room
//     socket.to(data.channelName).emit("caption-receive", {
//       text: data.text,
//       userName: data.userName,
//       senderId: socket.id // Helpful for debugging
      
//     });
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });

// // ✅ START SERVER CORRECTLY
// server.listen(5000, () => {
//   console.log("🚀 Backend running on port 5000");
// });


import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

import signupRoute from "./routes/signup.js";
import loginRoute from "./routes/login.js";
import searchProfilesRoute from "./routes/searchProfiles.js";
import userRoute from "./routes/user.js";
import chatRoutes from "./routes/chat.js";
import registerChatHandlers from "./sockets/chat.js";
import socketAuth from "./sockets/socketAuth.js";
import agoraTokenRoute from "./routes/agoraToken.js";
import challengeRoutes from "./routes/challenge.js"
import { startChallengeScheduler } from "./jobs/challengeScheduler.js"
const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.use("/signup", signupRoute);
app.use("/login", loginRoute);
app.use("/search-profiles", searchProfilesRoute);
app.use("/user", userRoute);
app.use("/chat", chatRoutes);
app.use("/api/agora", agoraTokenRoute);
app.use("/challenge", challengeRoutes)
// HTTP server
const server = http.createServer(app);

// Socket.IO
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
    console.log(`User ${socket.id} joined room: ${channelName}`);
    
    // Optional: Tell the user they joined successfully
    socket.emit("joined-success", channelName);
  });

  // socket.on("caption-send", (data) => {
  //   // Log this to see if data is actually reaching the server
  //   console.log(`Caption from ${socket.id} to room ${data.channelName}: ${data.text}`);
    
  //   // Broadcast to others in the room
  //   io.to(data.channelName).emit("caption-receive", {
  //     text: data.text,
  //     userName: data.userName,
  //     senderId: socket.id // Helpful for debugging
      
  //   });
  // });
// Server (index.js)
socket.on("call-status-update", (data) => {
  // Broadcast to everyone in the channel including the sender
  io.to(data.channelName).emit("call-status-update", data);
});
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ✅ START SERVER CORRECTLY
server.listen(5000, () => {
  console.log("🚀 Backend running on port 5000");
});
startChallengeScheduler();