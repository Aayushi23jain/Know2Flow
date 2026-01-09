import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [meUid, setMeUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    country: "",
    experienceLevel: "",
    language: "",
    teachSkillsCSV: "",
    learnSkillsCSV: "",
  });
  const [saving, setSaving] = useState(false);
const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`http://localhost:5000/user/${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error("User not found");
        return r.json();
      })
      .then((data) => {
        setUser(data);
        setForm({
          name: data.name || "",
          country: data.country || "",
          experienceLevel: data.experienceLevel || "",
          language: data.language || "",
          teachSkillsCSV: (data.teachSkills || []).join(", "),
          learnSkillsCSV: (data.learnSkills || []).join(", "),
        });
      })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    fetch("http://localhost:5000/user/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.userId && setMeUid(data.userId))
      .catch(() => {})
      .finally(() => setAuthLoading(false)); 
  }, []);

const isOwner =
  !authLoading &&
  meUid &&
  user &&
  user._id === meUid;

  
  

  const feedbacks = [
    {
      reviewer: "Alice",
      rating: 5,
      text: "Great mentor! Helped me understand complex topics easily.",
    },
    {
      reviewer: "Bob",
      rating: 4,
      text: "Very supportive and patient. Highly recommend!",
    },
    {
      reviewer: "Charlie",
      rating: 4,
      text: "Good teaching skills, but could be more responsive.",
    },
  ];

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          teachSkills: form.teachSkillsCSV
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          learnSkills: form.learnSkillsCSV
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setUser(await res.json());
      setEditMode(false);
    } catch (e) {
      console.log(e.Error);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading profile...
      </div>
    );

  if (error)
    return <div className="min-h-screen p-6 text-red-400">Error: {error}</div>;

  return (
    <div
      className="min-h-screen relative overflow-hidden text-white p-6
    bg-gradient-to-br from-[#0b0b10] via-[#111421] to-[#0a0c14]"
    >
      {/* ambient glow */}
      <div className="absolute -top-40 -left-40 w-[420px] h-[420px] bg-yellow-400/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[420px] h-[420px] bg-orange-400/10 rounded-full blur-[140px]" />

      <button
        className="relative mb-6 text-sm text-gray-400 hover:text-white transition"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      {/* PROFILE CARD */}
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

        {/* HEADER */}
        <div className="relative flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
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

          <div className="flex items-center gap-1 ml-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-2xl ${
                  star <= 4 ? "text-yellow-400" : "text-gray-500"
                }`}
                title={`${4} out of 5 stars`}
              >
                ★
              </span>
            ))}
          </div>

          {!authLoading && isOwner && (
  <button onClick={() => setEditMode(v => !v)}>
    {editMode ? "Cancel" : "Edit Profile"}
  </button>
)}


        </div>

        {/* CONTENT */}
        {!editMode ? (
          <>
            <div className="mt-8">
              <h3 className="font-semibold text-gray-300">Teach Skills</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(user.teachSkills || []).map((s, i) => (
                  <span
                    key={i}
                    className="bg-gray-800/80 px-3 py-1 rounded-full text-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-gray-300">Learn Skills</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(user.learnSkills || []).map((s, i) => (
                  <span
                    key={i}
                    className="bg-gray-800/80 px-3 py-1 rounded-full text-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold text-gray-300 mb-3">
                Feedback Received
              </h3>
              <div className="space-y-4">
                {feedbacks.slice(0, 3).map((fb, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-semibold text-yellow-300">
                        {fb.reviewer}
                      </div>
                      <div className="text-gray-200 mt-1">{fb.text}</div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 sm:mt-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            star <= fb.rating
                              ? "text-yellow-400"
                              : "text-gray-500"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end mt-2">
                  <span
                    className="cursor-pointer text-yellow-400 hover:text-orange-400 font-semibold transition"
                    onClick={() => alert("View more feedbacks coming soon!")}
                  >
                    View More
                  </span>
                </div>
              </div>
            </div>

{!authLoading && !isOwner && (


            <div className="mt-8 flex justify-between items-center">
              <div className="flex gap-4">
                {/* MESSAGE */}
                <button
                  className="px-5 py-2 rounded-full
      bg-gradient-to-r from-yellow-400/15 to-orange-400/15
      border border-yellow-400/30
      text-white-300
      hover:from-yellow-400/25 hover:to-orange-400/25
      hover:text-yellow-200
      transition"
                  onClick={() =>navigate(`/chat/${userId}`)}
                >
                  Message
                </button>

                {/* FEEDBACK */}
                <button
                  className="px-5 py-2 rounded-full
      bg-gradient-to-r from-yellow-400/15 to-orange-400/15
      border border-yellow-400/30
      text-white-300
      hover:from-yellow-400/25 hover:to-orange-400/25
      hover:text-yellow-200
      transition"
                  onClick={() => navigate(`/feedback/${userId}`)}
                >
                  Feedback
                </button>
              </div>

              {/* REPORT */}
              <button
                className="px-5 py-2
    bg-gradient-to-r from-red-500/10 to-red-600/10
    border border-red-500/30
    text-white-500
    hover:from-red-500/20 hover:to-red-600/20
    hover:text-red-300
    transition"
                onClick={() => alert("Report user")}
              >
                Report
              </button>
            </div>
)}
          </>
        ) : (
          <div className="mt-8 space-y-4">
            {[
              "name",
              "country",
              "experienceLevel",
              "language",
              "teachSkillsCSV",
              "learnSkillsCSV",
            ].map((f) => (
              <input
                key={f}
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                placeholder={f}
                className="w-full px-4 py-2 rounded
                bg-black/60 border border-white/10
                shadow-inner focus:outline-none focus:border-yellow-400"
              />
            ))}

            <button
              disabled={saving}
              onClick={onSave}
              className="bg-gradient-to-r from-yellow-400 to-orange-400
              text-black px-6 py-2 rounded-full font-semibold
              shadow-[0_15px_40px_rgba(250,204,21,0.5)]
              hover:scale-105 transition"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}