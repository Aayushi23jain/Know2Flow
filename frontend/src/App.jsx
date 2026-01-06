
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Matches from "./pages/Matches";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Feedback from "./pages/Feedback";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard/:userId" element={<Dashboard />} />
      <Route path="/matches/:userId" element={<Matches />} />
      <Route path="/profile/:userId" element={<Profile />} />
      <Route path="/feedback/:userId" element={<Feedback />} />
    </Routes>
  );
}

export default App;