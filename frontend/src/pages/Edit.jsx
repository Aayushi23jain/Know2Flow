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

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="min-h-screen p-6 text-white bg-black">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      {/* <div className="space-y-4 max-w-xl">
        {Object.keys(form).map((f) => (
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
          className="px-6 py-2 bg-yellow-400 text-black rounded-full"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div> */}



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
      
    </div>
  );
}
