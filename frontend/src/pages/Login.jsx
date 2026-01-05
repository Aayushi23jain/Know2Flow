import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";


export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);


  const spinnerStyle = document.createElement("style");
spinnerStyle.innerHTML = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`;
document.head.appendChild(spinnerStyle);


  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
    // 1️⃣ Firebase login
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // 2️⃣ Check email verification
    if (!user.emailVerified) {
      alert("❌ Please verify your email before logging in.");
      await auth.signOut();
      setLoading(false);
      return;
    }

    // 3️⃣ Backend login (same as before)
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Login failed");
      setLoading(false);
      return;
    }

    localStorage.setItem("userId", data.userId);
    navigate(`/dashboard/${data.userId}`);
  } catch (error) {
    alert(error.message || "Login failed ❌");
    setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(365deg, #767eea, #7ba2)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
          width: "350px",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "20px", color: "#333" }}>Login</h2>
        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              margin: "10px 0",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              outline: "none",
              transition: "0.3s",
            }}
            onFocus={(e) => (e.target.style.border = "1px solid #667eea")}
            onBlur={(e) => (e.target.style.border = "1px solid #ccc")}
            required
          />

          <div style={{ position: "relative", margin: "10px 0" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                width: "100%",
                outline: "none",
                transition: "0.3s",
              }}
              onFocus={(e) => (e.target.style.border = "1px solid #667eea")}
              onBlur={(e) => (e.target.style.border = "1px solid #ccc")}
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: "18px",
                userSelect: "none",
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <button
  type="submit"
  disabled={loading}
  style={{
    margin: "20px 0",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    fontWeight: "bold",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  }}
>
  {loading ? (
    <>
      <span
        style={{
          width: "18px",
          height: "18px",
          border: "2px solid white",
          borderTop: "2px solid transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      Logging in...
    </>
  ) : (
    "Login"
  )}
</button>

        </form>

        <p style={{ fontSize: "14px", marginTop: "10px", color: "#666" }}>
          Don’t have an account?{" "}
          <Link
            to="/signup"
            style={{ color: "#667eea", textDecoration: "none" }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
