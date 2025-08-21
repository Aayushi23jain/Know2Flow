import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

// Import Routes
import signupRoute from "./routes/signup.js";
import loginRoute from "./routes/login.js";
import searchProfilesRoute from "./routes/searchProfiles.js";

// Import socket handlers
import registerChatHandlers from "./sockets/chat.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/signup", signupRoute);
app.use("/login", loginRoute);
app.use("/search-profiles", searchProfilesRoute);

// Create HTTP server (for socket.io)
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // React frontend URL
    methods: ["GET", "POST"],
  },
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // register chat handlers
  registerChatHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(" User disconnected:", socket.id);
  });
});

// Start server
app.listen(5000, () => console.log("🚀 Backend running on port 5000"));
