"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { getCategories, updateProfile, updateSubjects, createPackage } from "@/lib/actions/mentor";
import { toast } from "sonner";
import PackageCard from "../../components/PackageCard";

interface Category {
  _id: string;
  name: string;
}

export default function SetupProfilePage() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [bio, setBio] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const [pkg, setPkg] = useState({
    title: "",
    description: "",
    subject: "",
    durationValue: "",
    durationUnit: "week" as "day" | "week" | "month",
    sessionType: "online" as "online" | "in-person" | "hybrid",
    price: "",
  });

  useEffect(() => {
    getCategories().then((res) => {
      if (res.success) setCategories(res.data || []);
      else toast.error(res.message);
      setLoadingCategories(false);
    });
  }, []);

  const updatePkg = (k: string, v: string) => setPkg((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (selectedSubjects.length === 1) {
      updatePkg("subject", selectedSubjects[0]);
    }
  }, [selectedSubjects]);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectedCategory = categories.find((c) => c._id === pkg.subject);

  const previewPackage = {
    _id: "preview",
    title: pkg.title || "Package title",
    description: pkg.description || "Your package description will appear here.",
    price: pkg.price ? Number(pkg.price) : 0,
    durationValue: pkg.durationValue ? Number(pkg.durationValue) : 0,
    durationUnit: pkg.durationUnit,
    subject: selectedCategory ? { _id: selectedCategory._id, name: selectedCategory.name } : undefined,
    mentor: {
      _id: "preview-mentor",
      fullname: user?.fullname || "Your name",
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bio.trim()) return toast.error("Bio is required");
    if (selectedSubjects.length === 0) return toast.error("Select at least one subject");
    if (!pkg.title || !pkg.description || !pkg.subject || !pkg.durationValue || !pkg.price) {
      return toast.error("Please complete all package fields");
    }

    setSubmitting(true);

    const profileRes = await updateProfile({ bio });
    if (!profileRes.success) {
      toast.error(profileRes.message);
      setSubmitting(false);
      return;
    }

    const subjectsRes = await updateSubjects(selectedSubjects);
    if (!subjectsRes.success) {
      toast.error(subjectsRes.message);
      setSubmitting(false);
      return;
    }

    const packageRes = await createPackage({
      title: pkg.title,
      description: pkg.description,
      subject: pkg.subject,
      durationValue: Number(pkg.durationValue),
      durationUnit: pkg.durationUnit,
      sessionType: pkg.sessionType,
      price: Number(pkg.price),
    });

    if (!packageRes.success) {
      toast.error(packageRes.message);
      setSubmitting(false);
      return;
    }

    const updatedUser = { ...user!, isProfileSetup: true };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    toast.success("Profile set up!");
    router.push("/mentor/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel: brand + live preview */}
      <div className="hidden lg:flex lg:w-[42%] relative bg-gradient-to-br from-[#0B0F2E] via-[#161A45] to-[#2A2F6B] overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #3B5EFF, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #7C86F5, transparent 70%)" }}
        />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <span className="font-bold text-xl tracking-tight text-white">
            Mentor<span className="text-[#7C86F5]">a</span>
          </span>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7C86F5] mb-3">
              Preview
            </p>
            <p className="text-slate-300 text-sm mb-5 leading-relaxed">
              This is roughly how learners will see you.
            </p>

            <PackageCard pkg={previewPackage} onClick={() => { }} />
          </div>

          <p className="text-xs text-slate-500">Step 1 of 1. This only takes a minute.</p>
        </div>
      </div>

      {/* Right panel: form */}
      <div className="flex-1 flex justify-center overflow-y-auto">
        <div className="w-full max-w-lg px-6 py-12">
          <span className="lg:hidden font-bold text-xl tracking-tight text-slate-900 mb-8 block">
            Mentor<span className="text-[#3B5EFF]">a</span>
          </span>

          <h1 className="text-3xl font-bold text-slate-900 mb-1">Set up your profile</h1>
          <p className="text-slate-500 text-sm mb-8">
            Learners see this before they book. Make it count.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                About you
              </p>
              <label className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700">Bio</span>
                <span className={`text-xs ${bio.length > 250 ? "text-red-500" : "text-slate-400"}`}>
                  {bio.length}/250
                </span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 250))}
                maxLength={250}
                rows={3}
                placeholder="Tell learners about your expertise and teaching style..."
                className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent resize-none transition"
              />

              <label className="block text-sm font-medium text-slate-700 mb-1.5 mt-4">
                Subjects you teach
              </label>
              {loadingCategories ? (
                <p className="text-sm text-slate-400">Loading categories...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const active = selectedSubjects.includes(c._id);
                    return (
                      <button
                        type="button"
                        key={c._id}
                        onClick={() => toggleSubject(c._id)}
                        className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${active
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
              )}
            </div>

            <div className="border-t border-slate-100 pt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Your first package
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={pkg.title}
                    onChange={(e) => updatePkg("title", e.target.value)}
                    placeholder="e.g. React Fundamentals"
                    className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                  <textarea
                    value={pkg.description}
                    onChange={(e) => updatePkg("description", e.target.value)}
                    rows={2}
                    placeholder="What's included in this package?"
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent resize-none transition"
                  />
                </div>

                {selectedSubjects.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Which subject is this package for?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories
                        .filter((c) => selectedSubjects.includes(c._id))
                        .map((c) => {
                          const active = pkg.subject === c._id;
                          return (
                            <button
                              type="button"
                              key={c._id}
                              onClick={() => updatePkg("subject", c._id)}
                              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${active
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
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration</label>
                    <input
                      type="number"
                      min="1"
                      value={pkg.durationValue}
                      onChange={(e) => updatePkg("durationValue", e.target.value)}
                      className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit</label>
                    <select
                      value={pkg.durationUnit}
                      onChange={(e) => updatePkg("durationUnit", e.target.value)}
                      className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Session type</label>
                    <select
                      value={pkg.sessionType}
                      onChange={(e) => updatePkg("sessionType", e.target.value)}
                      className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
                    >
                      <option value="online">Online</option>
                      <option value="in-person">In-person</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Price (NPR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={pkg.price}
                      onChange={(e) => updatePkg("price", e.target.value)}
                      className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-[#3B5EFF] hover:bg-[#2f4de0] disabled:opacity-60 text-white font-semibold rounded-xl transition"
            >
              {submitting ? "Saving..." : "Complete setup →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}