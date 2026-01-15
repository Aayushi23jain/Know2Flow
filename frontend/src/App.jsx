import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Matches from "./pages/Matches";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ChatPage from "./pages/ChatPage";
import Feedback from "./pages/Feedback";
import Challenge from "./pages/Challenge";
import VideoCall from "./pages/VideoCall";
import Leaderboard from "./pages/Leaderboard"; 
import Edit from "./pages/Edit";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard/:userId" element={<Dashboard />} />
      <Route path="/matches/:userId" element={<Matches />} />
      <Route path="/profile/:userId" element={<Profile />} />
      <Route path="/chat/:userId" element={<ChatPage />} />
      <Route path="/feedback/:userId" element={<Feedback />} />
      <Route path="/edit/:userId" element={<Edit />} />
      <Route path="/video-call/:userId" element={<VideoCall />} />
      <Route path="/leaderboard/:userId" element={<Leaderboard />} />
      <Route path="/challenge" element={<Challenge />} />
    </Routes>
  );
}

export default App;



