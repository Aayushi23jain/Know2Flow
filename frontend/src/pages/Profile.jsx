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

  // Request /user/me to determine current logged-in UID
  useEffect(() => {
    fetch("http://localhost:5000/user/me", { credentials: "include" })
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (data?.userId) setMeUid(data.userId);
      })
      .catch(() => {
        // not logged in or no cookie
      });
  }, []);

  const isOwner = meUid && meUid === userId;

  const onSave = async () => {
    setSaving(true);
    const body = {
      name: form.name,
      country: form.country,
      experienceLevel: form.experienceLevel,
      language: form.language,
      teachSkills: form.teachSkillsCSV.split(",").map((s) => s.trim()).filter(Boolean),
      learnSkills: form.learnSkillsCSV.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      const res = await fetch(`http://localhost:5000/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed to save");
      }
      const updated = await res.json();
      setUser(updated);
      setEditMode(false);
    } catch (e) {
      alert("Save failed: " + (e.message || e));
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-300">
        Loading profile...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen p-6">
        <button className="mb-4 text-sm text-blue-300" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="bg-gray-900 p-6 rounded text-red-400">Error: {error}</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-r from-black via-gray-900 to-gray-800 text-white p-6">
      <button className="mb-6 text-sm text-blue-300" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="max-w-3xl mx-auto bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 shadow">
        <div className="flex items-center gap-6 justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-orange-300 flex items-center justify-center text-black font-bold text-2xl">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-400">{user.email}</p>
              <div className="text-sm text-gray-400 mt-1">Country: {user.country || "N/A"}</div>
            </div>
          </div>

          <div>
            {isOwner ? (
              <div className="flex gap-2">
                <button
                  className="bg-yellow-400 text-black px-4 py-2 rounded font-semibold"
                  onClick={() => setEditMode((v) => !v)}
                >
                  {editMode ? "Cancel" : "Edit Profile"}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {!editMode ? (
          <>
            <div className="mt-8">
              <h3 className="font-semibold text-gray-200">Teach Skills</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(user.teachSkills || []).map((s, i) => (
                  <span key={i} className="bg-gray-800 px-3 py-1 rounded-full text-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-gray-200">Learn Skills</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(user.learnSkills || []).map((s, i) => (
                  <span key={i} className="bg-gray-800 px-3 py-1 rounded-full text-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                className="bg-gray-700 px-4 py-2 rounded"
                onClick={() => alert("Message coming soon!")}
              >
                Message
              </button>
              <button className="bg-gray-700 px-4 py-2 rounded" onClick={() => alert("Report user")}>
                Report
              </button>
            </div>
          </>
        ) : (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-300">Full name</label>
              <input
                className="mt-1 w-full px-3 py-2 bg-black border rounded"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300">Country</label>
                <input
                  className="mt-1 w-full px-3 py-2 bg-black border rounded"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300">Experience</label>
                <input
                  className="mt-1 w-full px-3 py-2 bg-black border rounded"
                  value={form.experienceLevel}
                  onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300">Language</label>
              <input
                className="mt-1 w-full px-3 py-2 bg-black border rounded"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300">Teach Skills (comma separated)</label>
              <input
                className="mt-1 w-full px-3 py-2 bg-black border rounded"
                value={form.teachSkillsCSV}
                onChange={(e) => setForm({ ...form, teachSkillsCSV: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300">Learn Skills (comma separated)</label>
              <input
                className="mt-1 w-full px-3 py-2 bg-black border rounded"
                value={form.learnSkillsCSV}
                onChange={(e) => setForm({ ...form, learnSkillsCSV: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <button
                disabled={saving}
                onClick={onSave}
                className="bg-yellow-400 text-black px-4 py-2 rounded font-semibold"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button className="bg-gray-700 px-4 py-2 rounded" onClick={() => setEditMode(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}