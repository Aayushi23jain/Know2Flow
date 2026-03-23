import React, { useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    teachSkills: "",
    learnSkills: "",
    language: "",
    experienceLevel: "",
    country: "",
  });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationUser, setVerificationUser] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Set displayName in Firebase Auth
      await updateProfile(user, { displayName: formData.name });

      await sendEmailVerification(user, {
        url: "http://localhost:5173/login",
      });
      setVerificationUser(user);
      setMessage("📧 Verification link sent! Please check your inbox.");
      setLoading(false);

      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          teachSkills: formData.teachSkills.split(",").map((s) => s.trim()),
          learnSkills: formData.learnSkills.split(",").map((s) => s.trim()),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.details || data.error || "Signup failed ❌");
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("Signup error:", error);
      let msg = "Something went wrong ❌";

      if (error.code === "auth/weak-password") {
        msg = "Password must be at least 6 characters long.";
      } else if (error.code === "auth/email-already-in-use") {
        msg = "This email is already registered.";
      } else if (error.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (error.message) {
        msg = error.message;
      }

      setMessage(msg);
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden text-white flex items-center justify-center py-12 px-4
      bg-[radial-gradient(ellipse_at_top_left,_rgba(255,186,73,0.08),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(255,215,0,0.05),_transparent_55%),linear-gradient(135deg,#0b0b10,#111421,#141a2b,#0a0c14)]"
    >
      {/* Ambient background glow */}
      <div className="absolute top-[-120px] left-[-120px] w-[420px] h-[420px] bg-orange-400/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[420px] h-[420px] bg-yellow-400/10 rounded-full blur-[140px]" />

      <div
        className="relative z-10 w-full max-w-2xl bg-gradient-to-br from-[#161a23] via-[#0f1117] to-[#0b0c10] 
        border border-white/10 rounded-2xl p-8 md:p-12 shadow-[0_40px_90px_rgba(0,0,0,0.95)] backdrop-blur-sm"
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-white">
            Join Know2Flow
          </h2>
          <p className="text-gray-400 mt-2 italic text-sm">
            Swap Skills, No Bills
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">
              FULL NAME
            </label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
              className="p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              name="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-xs font-semibold text-gray-400 ml-1">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition w-full"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-white"
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          {/* Language */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">
              PRIMARY LANGUAGE
            </label>
            <input
              type="text"
              name="language"
              placeholder="e.g. English"
              value={formData.language}
              onChange={handleChange}
              required
              className="p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition"
            />
          </div>

          {/* Skills to Teach */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">
              SKILLS YOU CAN TEACH
            </label>
            <input
              type="text"
              name="teachSkills"
              placeholder="React, Dancing, Cooking (comma separated)"
              value={formData.teachSkills}
              onChange={handleChange}
              required
              className="p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition"
            />
          </div>

          {/* Skills to Learn */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">
              SKILLS YOU WANT TO LEARN
            </label>
            <input
              type="text"
              name="learnSkills"
              placeholder="Python, UI Design, Yoga (comma separated)"
              value={formData.learnSkills}
              onChange={handleChange}
              required
              className="p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition"
            />
          </div>

          {/* Experience Level */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">
              EXPERIENCE
            </label>
            <select
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleChange}
              required
              className="p-3 bg-[#1a1d26] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition text-gray-300"
            >
              <option value="">Select Level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Country */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 ml-1">
              COUNTRY
            </label>
            <input
              type="text"
              name="country"
              placeholder="India"
              value={formData.country}
              onChange={handleChange}
              required
              className="p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`md:col-span-2 mt-4 flex items-center justify-center gap-2 
              bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 rounded-xl shadow-lg transition
              ${
                loading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:scale-[1.02] hover:shadow-orange-500/20"
              }`}
          >
            {loading ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></span>
                PREPARING YOUR FLOW...
              </>
            ) : (
              "CREATE ACCOUNT"
            )}
          </button>
        </form>

        {message && (
          <div className="mt-6 p-4 rounded-xl bg-orange-400/10 border border-orange-400/20 text-center text-sm font-medium text-orange-200">
            {message}
          </div>
        )}

        {verificationUser && (
          <div className="text-center mt-4">
            <button
              onClick={async () => {
                try {
                  await sendEmailVerification(verificationUser, {
                    url: "http://localhost:5173/login",
                  });
                  setMessage("✅ Email resent. Check your spam folder too!");
                } catch (err) {
                  console.error(err);
                  setMessage("❌ Failed to resend email.");
                }
              }}
              className="text-orange-400 text-sm font-bold hover:underline"
            >
              Resend verification email
            </button>
          </div>
        )}

        <p className="text-center text-gray-500 mt-8 text-sm">
          Already a member?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-white font-bold hover:text-orange-400 transition"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}
