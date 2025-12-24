import React, { useState } from "react";

export default function Signup() {
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
  const [showPassword, setShowPassword] = useState(false); // 🔑 toggle password

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage("");

  try {
    const response = await fetch("http://localhost:5000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...formData,
        teachSkills: formData.teachSkills.split(",").map(s => s.trim()),
        learnSkills: formData.learnSkills.split(",").map(s => s.trim()),
      }),
    });

    const data = await response.json();
    console.log("Signup response:", response.status, data);
    if (!response.ok) {
      setMessage(data.details || data.error || "Signup failed ❌");
      return;
    }

    // ✅ Save user ID & redirect to dashboard
    localStorage.setItem("userId", data.userId);
    window.location.href = `/dashboard/${data.userId}`;

  } catch (error) {
    console.error("Signup error:", error);
    setMessage("Server error ❌");
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-200 via-purple-100 to-pink-200">
      <div className="bg-orange-50 shadow-lg rounded-2xl p-10 w-full max-w-2xl border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
          Create Your Account
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} // 🔑 toggle type
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
            >
              {showPassword ? "🙈" : "👁️"} {/* eye icon */}
            </span>
          </div>

          <input
            type="text"
            name="language"
            placeholder="Language (e.g. English)"
            value={formData.language}
            onChange={handleChange}
            required
            className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="text"
            name="teachSkills"
            placeholder="Skills you can teach (comma separated)"
            value={formData.teachSkills}
            onChange={handleChange}
            required
            className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-2"
          />
          <input
            type="text"
            name="learnSkills"
            placeholder="Skills you want to learn (comma separated)"
            value={formData.learnSkills}
            onChange={handleChange}
            required
            className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-2"
          />

          <select
            name="experienceLevel"
            value={formData.experienceLevel}
            onChange={handleChange}
            required
            className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Select Experience</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          <input
            type="text"
            name="country"
            placeholder="Country"
            value={formData.country}
            onChange={handleChange}
            required
            className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <button
            type="submit"
            className="col-span-2 w-full bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-md transition hover:bg-indigo-600"
          >
            Sign Up
          </button>
        </form>

        {message && (
          <p className="text-center text-gray-700 mt-6 font-semibold">{message}</p>
        )}

        <p className="text-center text-gray-600 mt-6">
  Already have an account?{" "}
  <a href="/login" className="text-indigo-500 font-bold hover:underline">
    Login
  </a>
</p>

      </div>
    </div>
  );
}
