import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { apiCall } from "../utils/apiClient";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

      // 3️⃣ Backend login
      const data = await apiCall("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("userId", data.userId);
      navigate(`/dashboard/${data.userId}`);
    } catch (error) {
      alert(error.message || "Login failed ❌");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden text-white flex items-center justify-center px-4
      bg-[radial-gradient(ellipse_at_top_left,_rgba(255,186,73,0.08),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(255,215,0,0.05),_transparent_55%),linear-gradient(135deg,#0b0b10,#111421,#141a2b,#0a0c14)]">
      
      {/* Ambient background glow */}
      <div className="absolute top-[-120px] left-[-120px] w-[420px] h-[420px] bg-orange-400/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[420px] h-[420px] bg-yellow-400/10 rounded-full blur-[140px]" />

      <div className="relative z-10 w-full max-w-md bg-gradient-to-br from-[#161a23] via-[#0f1117] to-[#0b0c10] 
        border border-white/10 rounded-2xl p-8 md:p-10 shadow-[0_40px_90px_rgba(0,0,0,0.95)] backdrop-blur-sm">
        
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-white">
            Welcome Back
          </h2>
          <p className="text-gray-400 mt-2 italic text-sm">Continue your skill-swapping journey</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 ml-1 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition placeholder:text-gray-600"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-xs font-semibold text-gray-400 ml-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition w-full placeholder:text-gray-600"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 
              bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 rounded-xl shadow-lg transition-all
              ${loading ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02] hover:shadow-orange-500/20 active:scale-95"}`}
          >
            {loading ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></span>
                AUTHENTICATING...
              </>
            ) : (
              "LOGIN"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-gray-500 text-sm">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-white font-bold hover:text-orange-400 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}