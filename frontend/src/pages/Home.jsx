import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* <nav className="navbar">
        <h2>Know2Flow</h2>
        <div>
          <button onClick={() => navigate("/login")}>Login</button>
          <button onClick={() => navigate("/signup")}>Signup</button>
        </div>
      </nav> */}

      <div className="hero">
        <h1>KNOW2FLOW</h1>
        <p>Swap Skills, No Bills</p>

        <div className="mt-8 flex gap-4">
          <button className="cta" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
          <button
            className="cta"
            style={{
              background: "linear-gradient(135deg,#38bdf8,#6366f1)",
            }}
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
        </div>

        <div className="mt-12 max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded p-5 text-left">
            <h4 className="font-semibold text-lg">Swap Skills</h4>
            <p className="text-gray-300 text-sm mt-2">
              Teach what you know and learn what you don’t — fast and free.
            </p>
          </div>
          <div className="bg-gray-800 rounded p-5 text-left">
            <h4 className="font-semibold text-lg">Safe & Secure</h4>
            <p className="text-gray-300 text-sm mt-2">
              Privacy-first profiles and opt-in contact — connect confidently.
            </p>
          </div>
          <div className="bg-gray-800 rounded p-5 text-left">
            <h4 className="font-semibold text-lg">Community</h4>
            <p className="text-gray-300 text-sm mt-2">
              Join events, collaborate, and find study buddies in your area.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
