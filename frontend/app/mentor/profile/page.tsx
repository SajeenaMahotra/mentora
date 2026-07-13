"use client";
import { useState, useEffect } from "react";
import {
  getMyProfile,
  getMyPackages,
  getCategories,
  updateProfile,
  updateSubjects,
  createPackage,
  updatePackage,
  deletePackage,
} from "@/lib/actions/mentor";
import { toast } from "sonner";

interface Category {
  _id: string;
  name: string;
}

interface Profile {
  fullname: string;
  bio: string | null;
  subjects: string[];
}

interface Package {
  _id: string;
  title: string;
  description: string;
  price: number;
  durationValue: number;
  durationUnit: "day" | "week" | "month";
  sessionType: "online" | "in-person" | "hybrid";
  subject: Category;
}

const emptyPkgForm = {
  title: "",
  description: "",
  subject: "",
  durationValue: "",
  durationUnit: "week" as "day" | "week" | "month",
  sessionType: "online" as "online" | "in-person" | "hybrid",
  price: "",
};

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
  const [newPkg, setNewPkg] = useState(emptyPkgForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPkg, setEditPkg] = useState(emptyPkgForm);
  const [savingEdit, setSavingEdit] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refreshPackages = async () => {
    const res = await getMyPackages();
    if (res.success) setPackages(res.data || []);
  };

  useEffect(() => {
    Promise.all([getMyProfile(), getMyPackages(), getCategories()]).then(
      ([profileRes, packagesRes, categoriesRes]) => {
        if (profileRes.success) {
          setProfile(profileRes.data);
          setBio(profileRes.data.bio || "");
          setSelectedSubjects(profileRes.data.subjects || []);
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
      await refreshPackages();
      setShowPackageForm(false);
      setNewPkg(emptyPkgForm);
    } else toast.error(res.message);
    setSavingPackage(false);
  };

  const startEdit = (p: Package) => {
    setEditingId(p._id);
    setEditPkg({
      title: p.title,
      description: p.description,
      subject: p.subject?._id || "",
      durationValue: String(p.durationValue),
      durationUnit: p.durationUnit,
      sessionType: p.sessionType,
      price: String(p.price),
    });
    setShowPackageForm(false);
    setConfirmDeleteId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPkg(emptyPkgForm);
  };

  const updateEditPkg = (k: string, v: string) => setEditPkg((f) => ({ ...f, [k]: v }));

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!editPkg.title || !editPkg.description || !editPkg.subject || !editPkg.durationValue || !editPkg.price) {
      return toast.error("Please complete all fields");
    }
    setSavingEdit(true);
    const res = await updatePackage(editingId, {
      title: editPkg.title,
      description: editPkg.description,
      subject: editPkg.subject,
      durationValue: Number(editPkg.durationValue),
      durationUnit: editPkg.durationUnit,
      sessionType: editPkg.sessionType,
      price: Number(editPkg.price),
    });
    if (res.success) {
      toast.success("Package updated");
      await refreshPackages();
      cancelEdit();
    } else toast.error(res.message);
    setSavingEdit(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    const res = await deletePackage(id);
    if (res.success) {
      toast.success("Package deleted");
      await refreshPackages();
      setConfirmDeleteId(null);
    } else toast.error(res.message);
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3B5EFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const packageFormFields = (
    values: typeof emptyPkgForm,
    update: (k: string, v: string) => void
  ) => (
    <div className="space-y-3">
      <input
        type="text"
        value={values.title}
        onChange={(e) => update("title", e.target.value)}
        placeholder="Title"
        className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
      />
      <textarea
        value={values.description}
        onChange={(e) => update("description", e.target.value)}
        placeholder="Description"
        rows={2}
        className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent resize-none transition"
      />
      <select
        value={values.subject}
        onChange={(e) => update("subject", e.target.value)}
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
          value={values.durationValue}
          onChange={(e) => update("durationValue", e.target.value)}
          placeholder="Duration"
          className="h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
        />
        <select
          value={values.durationUnit}
          onChange={(e) => update("durationUnit", e.target.value)}
          className="h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select
          value={values.sessionType}
          onChange={(e) => update("sessionType", e.target.value)}
          className="h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
        >
          <option value="online">Online</option>
          <option value="in-person">In-person</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <input
          type="number"
          min="0"
          value={values.price}
          onChange={(e) => update("price", e.target.value)}
          placeholder="Price (NPR)"
          className="h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
        />
      </div>
    </div>
  );

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
            onClick={() => {
              setShowPackageForm((s) => !s);
              cancelEdit();
            }}
            className="text-sm text-[#3B5EFF] font-medium hover:underline"
          >
            {showPackageForm ? "Cancel" : "+ Add package"}
          </button>
        </div>

        {packages.length === 0 && !showPackageForm && (
          <p className="text-sm text-slate-400 mb-2">No packages yet.</p>
        )}

        <div className="space-y-3 mb-4">
          {packages.map((p) =>
            editingId === p._id ? (
              <div key={p._id} className="rounded-xl border border-[#3B5EFF]/30 bg-slate-50 p-4">
                {packageFormFields(editPkg, updateEditPkg)}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="flex-1 h-10 bg-[#3B5EFF] hover:bg-[#2f4de0] disabled:opacity-60 text-white text-sm font-medium rounded-xl transition"
                  >
                    {savingEdit ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="h-10 px-4 text-sm font-medium text-slate-500 hover:text-slate-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : confirmDeleteId === p._id ? (
              <div key={p._id} className="flex items-center justify-between rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-sm text-red-700">Delete &quot;{p.title}&quot;? This cannot be undone.</p>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(p._id)}
                    disabled={deleting}
                    className="h-8 px-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="h-8 px-3 text-xs font-medium text-slate-500 hover:text-slate-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div key={p._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.title}</p>
                  <p className="text-xs text-slate-400">
                    {p.subject?.name} · {p.durationValue} {p.durationUnit} · {p.sessionType}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-sm font-semibold text-[#3B5EFF]">Rs {p.price}</p>
                  <button
                    onClick={() => startEdit(p)}
                    className="text-xs font-medium text-slate-500 hover:text-[#3B5EFF] transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(p._id)}
                    className="text-xs font-medium text-slate-500 hover:text-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {showPackageForm && (
          <div className="border-t border-slate-100 pt-4">
            {packageFormFields(newPkg, updateNewPkg)}
            <button
              onClick={handleCreatePackage}
              disabled={savingPackage}
              className="w-full h-11 mt-3 bg-[#3B5EFF] hover:bg-[#2f4de0] disabled:opacity-60 text-white text-sm font-medium rounded-xl transition"
            >
              {savingPackage ? "Creating..." : "Create package"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}