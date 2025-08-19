import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

// Import Routes
import signupRoute from "./routes/signup.js";
import loginRoute from "./routes/login.js";



const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/signup", signupRoute);
app.use("/login", loginRoute);

// Start server
app.listen(5000, () => console.log("Server running on port 5000"));
