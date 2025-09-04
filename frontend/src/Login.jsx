import { useState } from "react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

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
        <form style={{ display: "flex", flexDirection: "column" }}>
          <input
            type="email"
            placeholder="Email"
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
          />

          <div style={{ position: "relative", margin: "10px 0" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
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
            style={{
              margin: "20px 0",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "0.3s",
            }}
            onMouseOver={(e) =>
              (e.target.style.background = "linear-gradient(135deg, #5a67d8, #6b46c1)")
            }
            onMouseOut={(e) =>
              (e.target.style.background = "linear-gradient(135deg, #667eea, #764ba2)")
            }
          >
            Login
          </button>
        </form>
        <p style={{ fontSize: "14px", marginTop: "10px", color: "#666" }}>
          Don’t have an account?{" "}
          <a href="/signup" style={{ color: "#667eea", textDecoration: "none" }}>
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
