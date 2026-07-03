"use client";
import { useState, useEffect } from "react";
import {
  getMyProfile,
  getMyPackages,
  getCategories,
  updateProfile,
  updateSubjects,
  createPackage,
} from "@/lib/actions/mentor";
import { toast } from "sonner";

interface Category {
  _id: string;
  name: string;
}

interface Profile {
  fullname: string;
  bio: string | null;
  subjects: Category[];
}

interface Package {
  _id: string;
  title: string;
  description: string;
  price: number;
  durationValue: number;
  durationUnit: string;
  sessionType: string;
  subject: Category;
}

export default function MentorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [bio, setBio] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [savingSubjects, setSavingSubjects] = useState(false);

  const [showPackageForm, setShowPackageForm] = useState(false);
  const [savingPackage, setSavingPackage] = useState(false);
  const [newPkg, setNewPkg] = useState({
    title: "",
    description: "",
    subject: "",
    durationValue: "",
    durationUnit: "week" as "day" | "week" | "month",
    sessionType: "online" as "online" | "in-person" | "hybrid",
    price: "",
  });

  useEffect(() => {
    Promise.all([getMyProfile(), getMyPackages(), getCategories()]).then(
      ([profileRes, packagesRes, categoriesRes]) => {
        if (profileRes.success) {
          setProfile(profileRes.data);
          setBio(profileRes.data.bio || "");
          setSelectedSubjects((profileRes.data.subjects || []).map((s: Category) => s._id));
        } else toast.error(profileRes.message);

        if (packagesRes.success) setPackages(packagesRes.data || []);
        else toast.error(packagesRes.message);

        if (categoriesRes.success) setCategories(categoriesRes.data || []);
        else toast.error(categoriesRes.message);

        setLoading(false);
      }
    );
  }, []);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSaveBio = async () => {
    setSavingBio(true);
    const res = await updateProfile({ bio });
    if (res.success) toast.success("Bio updated");
    else toast.error(res.message);
    setSavingBio(false);
  };

  const handleSaveSubjects = async () => {
    if (selectedSubjects.length === 0) return toast.error("Select at least one subject");
    setSavingSubjects(true);
    const res = await updateSubjects(selectedSubjects);
    if (res.success) toast.success("Subjects updated");
    else toast.error(res.message);
    setSavingSubjects(false);
  };

  const updateNewPkg = (k: string, v: string) => setNewPkg((f) => ({ ...f, [k]: v }));

  const handleCreatePackage = async () => {
    if (!newPkg.title || !newPkg.description || !newPkg.subject || !newPkg.durationValue || !newPkg.price) {
      return toast.error("Please complete all fields");
    }
    setSavingPackage(true);
    const res = await createPackage({
      title: newPkg.title,
      description: newPkg.description,
      subject: newPkg.subject,
      durationValue: Number(newPkg.durationValue),
      durationUnit: newPkg.durationUnit,
      sessionType: newPkg.sessionType,
      price: Number(newPkg.price),
    });
    if (res.success) {
      toast.success("Package created");
      const refreshed = await getMyPackages();
      if (refreshed.success) setPackages(refreshed.data || []);
      setShowPackageForm(false);
      setNewPkg({
        title: "",
        description: "",
        subject: "",
        durationValue: "",
        durationUnit: "week",
        sessionType: "online",
        price: "",
      });
    } else toast.error(res.message);
    setSavingPackage(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3B5EFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Profile settings</h1>
        <p className="text-slate-500 text-sm">Edit your bio, subjects, and packages.</p>
      </div>

      <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-3">Bio</h2>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 250))}
          maxLength={250}
          rows={3}
          className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent resize-none transition mb-3"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{bio.length}/250</span>
          <button
            onClick={handleSaveBio}
            disabled={savingBio}
            className="h-9 px-4 bg-[#3B5EFF] hover:bg-[#2f4de0] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
          >
            {savingBio ? "Saving..." : "Save bio"}
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-3">Subjects you teach</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((c) => {
            const active = selectedSubjects.includes(c._id);
            return (
              <button
                key={c._id}
                type="button"
                onClick={() => toggleSubject(c._id)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
                  active
                    ? "bg-[#3B5EFF] text-white border-[#3B5EFF]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-[#3B5EFF]/40"
                }`}
              >
                {active && "✓ "}
                {c.name}
              </button>
            );
          })}
        </div>
        <button
          onClick={handleSaveSubjects}
          disabled={savingSubjects}
          className="h-9 px-4 bg-[#3B5EFF] hover:bg-[#2f4de0] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
        >
          {savingSubjects ? "Saving..." : "Save subjects"}
        </button>
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">Your packages</h2>
          <button
            onClick={() => setShowPackageForm((s) => !s)}
            className="text-sm text-[#3B5EFF] font-medium hover:underline"
          >
            {showPackageForm ? "Cancel" : "+ Add package"}
          </button>
        </div>

        {packages.length === 0 && !showPackageForm && (
          <p className="text-sm text-slate-400 mb-2">No packages yet.</p>
        )}

        <div className="space-y-3 mb-4">
          {packages.map((p) => (
            <div key={p._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{p.title}</p>
                <p className="text-xs text-slate-400">
                  {p.subject?.name} · {p.durationValue} {p.durationUnit} · {p.sessionType}
                </p>
              </div>
              <p className="text-sm font-semibold text-[#3B5EFF]">Rs {p.price}</p>
            </div>
          ))}
        </div>

        {showPackageForm && (
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <input
              type="text"
              value={newPkg.title}
              onChange={(e) => updateNewPkg("title", e.target.value)}
              placeholder="Title"
              className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
            />
            <textarea
              value={newPkg.description}
              onChange={(e) => updateNewPkg("description", e.target.value)}
              placeholder="Description"
              rows={2}
              className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent resize-none transition"
            />
            <select
              value={newPkg.subject}
              onChange={(e) => updateNewPkg("subject", e.target.value)}
              className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
            >
              <option value="">Select a subject</option>
              {categories
                .filter((c) => selectedSubjects.includes(c._id))
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="1"
                value={newPkg.durationValue}
                onChange={(e) => updateNewPkg("durationValue", e.target.value)}
                placeholder="Duration"
                className="h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
              />
              <select
                value={newPkg.durationUnit}
                onChange={(e) => updateNewPkg("durationUnit", e.target.value)}
                className="h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newPkg.sessionType}
                onChange={(e) => updateNewPkg("sessionType", e.target.value)}
                className="h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
              >
                <option value="online">Online</option>
                <option value="in-person">In-person</option>
                <option value="hybrid">Hybrid</option>
              </select>
              <input
                type="number"
                min="0"
                value={newPkg.price}
                onChange={(e) => updateNewPkg("price", e.target.value)}
                placeholder="Price (NPR)"
                className="h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
              />
            </div>
            <button
              onClick={handleCreatePackage}
              disabled={savingPackage}
              className="w-full h-11 bg-[#3B5EFF] hover:bg-[#2f4de0] disabled:opacity-60 text-white text-sm font-medium rounded-xl transition"
            >
              {savingPackage ? "Creating..." : "Create package"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}