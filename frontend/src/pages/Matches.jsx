import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Matches() {
  const { userId } = useParams();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/search-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.matches || []);
        setLoading(false);
      })
      .catch(() => {
        setMatches([]);
        setLoading(false);
      });
  }, [userId]);

  return (
    <div className="min-h-screen bg-black text-white px-8 py-10">
      <h1 className="text-4xl font-bold text-yellow-400 mb-8">
        Skill Matches
      </h1>

      {loading && <p className="text-gray-400">Finding best matches...</p>}

      {!loading && matches.length === 0 && (
        <p className="text-gray-400">No matching profiles found.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((m) => (
          <div
            key={m.userId}
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-semibold">{m.name}</h2>

            <p className="text-sm text-gray-400 mt-2">
              Match Score:{" "}
              <span className="text-yellow-400 font-bold">
                {(m.finalScore * 100).toFixed(0)}%
              </span>
            </p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigate(`/profile/${m.userId}`)}
                className="bg-yellow-400 text-black px-4 py-2 rounded"
              >
                View Profile
              </button>

              <button
                onClick={() => alert("Chat coming soon")}
                className="border border-gray-600 px-4 py-2 rounded"
              >
                Chat
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate(-1)}
        className="mt-10 text-gray-400 underline"
      >
        ← Back
      </button>
    </div>
  );
}