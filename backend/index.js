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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ✅ START SERVER CORRECTLY
server.listen(5000, () => {
  console.log("🚀 Backend running on port 5000");
});
