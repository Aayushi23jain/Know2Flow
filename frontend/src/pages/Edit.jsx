import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function EditProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    country: "",
    experienceLevel: "",
    language: "",
    teachSkillsCSV: "",
    learnSkillsCSV: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/user/${userId}`)
      .then((r) => r.json())
      .then((data) =>
        setForm({
          name: data.name || "",
          country: data.country || "",
          experienceLevel: data.experienceLevel || "",
          language: data.language || "",
          teachSkillsCSV: (data.teachSkills || []).join(", "),
          learnSkillsCSV: (data.learnSkills || []).join(", "),
        })
      )
      .finally(() => setLoading(false));
  }, [userId]);

  const onSave = async () => {
    setSaving(true);
    try {
      await fetch(`http://localhost:5000/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          teachSkills: form.teachSkillsCSV.split(",").map(s => s.trim()).filter(Boolean),
          learnSkills: form.learnSkillsCSV.split(",").map(s => s.trim()).filter(Boolean),
        }),
      });
      navigate(`/dashboard/${userId}`);
    } catch {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };
 

  const onCancel = () => navigate(-1);

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="min-h-screen p-6 bg-black text-white flex justify-center">
      <div className="w-full max-w-4xl bg-gray-900/60 border border-white/10 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Edit Profile</h1>
        
        </div>

        <div className="grid grid-cols-1 gap-6">
          <section aria-label="Basic info" className="space-y-4">
            <label className="block">
              <div className="text-sm text-gray-300 mb-1">Full name</div>
              <input
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                className="w-full px-4 py-2 rounded bg-black/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                aria-label="Full name"
              />
            </label>

            <label className="block">
              <div className="text-sm text-gray-300 mb-1">Country</div>
              <input
                name="country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="Country or city"
                className="w-full px-4 py-2 rounded bg-black/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </label>

            <label className="block">
              <div className="text-sm text-gray-300 mb-1">Experience level</div>
              <input
                name="experienceLevel"
                value={form.experienceLevel}
                onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                placeholder="e.g. Beginner, Intermediate, Expert"
                className="w-full px-4 py-2 rounded bg-black/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </label>

            <label className="block">
              <div className="text-sm text-gray-300 mb-1">Language</div>
              <input
                name="language"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                placeholder="Primary spoken language"
                className="w-full px-4 py-2 rounded bg-black/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </label>
          </section>

          <section aria-label="Skills" className="space-y-4">
            <div>
              <div className="text-base text-gray-300 mb-1">Skills you can teach</div>
              <input
                name="teachSkillsCSV"
                value={form.teachSkillsCSV}
                onChange={(e) => setForm({ ...form, teachSkillsCSV: e.target.value })}
                placeholder="Comma separated (e.g. React, Node.js, SQL)"
                className="w-full px-4 py-2 rounded bg-black/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />

              
            </div>

            <div>
              <div className="text-base text-gray-300 mb-1">Skills you want to learn</div>
              <input
                name="learnSkillsCSV"
                value={form.learnSkillsCSV}
                onChange={(e) => setForm({ ...form, learnSkillsCSV: e.target.value })}
                placeholder="Comma separated (e.g. Python, Docker)"
                className="w-full px-4 py-2 rounded bg-black/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />

              
            </div>
          </section>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            type="button"
            className="px-4 py-2 rounded bg-transparent border border-white/10 text-gray-300 hover:bg-white/5"
          >
            Cancel
          </button>

          <button
            disabled={saving}
            onClick={onSave}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-semibold shadow-[0_12px_30px_rgba(250,204,21,0.3)] hover:scale-105 transition"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
