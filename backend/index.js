import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

// Routes
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

const app = express();

/* ---------------- FIXED CORS (IMPORTANT FOR FIREBASE + RENDER) ---------------- */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://skillbarter-4dfe3.web.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow REST clients like Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("CORS not allowed"));
    },
    credentials: true, // ✅ FIXED: Changed to true to support cookies
  })
);

/* ---------------- MIDDLEWARE ---------------- */
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());

/* ---------------- ROUTES ---------------- */
app.use("/signup", signupRoute);
app.use("/login", loginRoute);
app.use("/search-profiles", searchProfilesRoute);
app.use("/user", userRoute);
app.use("/chat", chatRoutes);
app.use("/api/agora", agoraTokenRoute);
app.use("/challenge", challengeRoutes);
app.use("/api/stt", sttRoute);
app.use("/api/translate", translateRoute);

/* ---------------- HEALTH CHECK (IMPORTANT FOR RENDER DEBUGGING) ---------------- */
app.get("/", (req, res) => {
  res.json({ status: "Know2Flow backend running 🚀" });
});

/* ---------------- HTTP SERVER ---------------- */
const server = http.createServer(app);

/* ---------------- SOCKET.IO ---------------- */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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

  socket.on("caption-send", (data) => {
    socket.to(data.channelName).emit("caption-receive", {
      text: data.text,
      senderId: data.senderId,
    });
  });

  socket.on("call-status-update", (data) => {
    io.to(data.channelName).emit("call-status-update", data);
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit("call-end");
      }
    }
  });
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});