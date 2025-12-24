import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      <nav className="navbar">
        <h2>Know2Flow</h2>
        <div>
          <button onClick={() => navigate("/login")}>Login</button>
          <button onClick={() => navigate("/signup")}>Signup</button>
        </div>
      </nav>

      <div className="hero">
        <h1>KNOW2FLOW</h1>
        <p>Swap Skills, No Bills</p>
        {/* <button className="cta">Match Profiles</button> */}
      </div>
    </div>
  );
};

export default Home;
