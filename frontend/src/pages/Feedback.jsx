import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Feedback() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`http://localhost:5000/user/${userId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject("User not found")))
      .then((data) => setUser(data))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    // TODO: Connect to backend
    setTimeout(() => {
      setMessage("Thank you for your feedback!");
      setSubmitting(false);
      setFeedback("");
      setRating(0);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading user info...
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-white p-6 bg-gradient-to-br from-[#0b0b10] via-[#111421] to-[#0a0c14]">
      {/* ambient glow */}
      <div className="absolute -top-40 -left-40 w-[420px] h-[420px] bg-yellow-400/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[420px] h-[420px] bg-orange-400/10 rounded-full blur-[140px]" />

      <button
        className="relative mb-6 text-sm text-gray-400 hover:text-white transition"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      {/* FEEDBACK CARD */}
      <div
        className="relative max-w-3xl mx-auto rounded-2xl p-8
        bg-gradient-to-br from-[#161a23] via-[#0f1117] to-[#0b0c10]
        border border-white/10
        shadow-[0_45px_110px_rgba(0,0,0,0.95)]
        backdrop-blur"
      >
        {/* inner glow */}
        <div
          className="absolute inset-0 rounded-2xl
          bg-gradient-to-br from-yellow-400/5 via-transparent to-orange-400/5 pointer-events-none"
        />

        {/* PROFILE INFO */}
        {user && (
          <div className="flex items-center gap-6 mb-8">
            <div
              className="w-20 h-20 rounded-full
              bg-gradient-to-br from-yellow-400 to-orange-400
              flex items-center justify-center text-black font-bold text-2xl
              shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
            >
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-400">{user.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Country: {user.country || "N/A"}
              </p>
            </div>
          </div>
        )}

        {/* STAR RATING */}
        <div className="flex items-center mb-6">
          <span className="mr-3 text-lg text-gray-300">Rate this user:</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-3xl cursor-pointer transition-colors ${
                (hoverRating || rating) >= star
                  ? "text-yellow-400"
                  : "text-gray-500"
              }`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              role="button"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              ★
            </span>
          ))}
        </div>

        {/* FEEDBACK FORM */}
        <form onSubmit={handleSubmit}>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Enter your feedback here..."
            className="w-full h-32 px-4 py-3 rounded bg-black/60 border border-white/10 shadow-inner focus:outline-none focus:border-yellow-400 text-white mb-6 resize-none"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-full
              bg-gradient-to-r from-yellow-400/15 to-orange-400/15
              border border-yellow-400/30
              text-white-300
              hover:from-yellow-400/25 hover:to-orange-400/25
              hover:text-yellow-200
              transition font-semibold"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
        {message && (
          <p className="mt-6 text-center text-yellow-300 font-semibold">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
