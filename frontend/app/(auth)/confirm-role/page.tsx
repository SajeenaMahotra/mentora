"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/authContext";
import { updateRoleAction } from "../../../lib/actions/auth";
import { toast } from "sonner";

const roles = [
  { id: "learner", title: "I'm a Learner", desc: "I want to find expert mentors and book learning sessions.", icon: "🎓" },
  { id: "mentor", title: "I'm a Mentor", desc: "I want to share my expertise and teach others.", icon: "👨‍🏫" },
] as const;

export default function ConfirmRolePage() {
  const [selected, setSelected] = useState<"learner" | "mentor">("learner");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  const handleContinue = async () => {
    setLoading(true);
    const res = await updateRoleAction(selected);
    setLoading(false);

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    setUser(res.data);

    if (selected === "mentor") {
      router.push("/setup-profile");
    } else {
      router.push("/feed");
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Mentora!</h1>
        <p className="text-slate-500">How would you like to use the platform?</p>
      </div>

      <div className="space-y-4 mb-8">
        {roles.map((r) => (
          <button key={r.id} onClick={() => setSelected(r.id)}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${selected === r.id ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-2xl flex-shrink-0">{r.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{r.title}</h3>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected === r.id ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                    {selected === r.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-1">{r.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button onClick={handleContinue} disabled={loading}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-base transition">
        {loading ? "Setting up..." : "Continue →"}
      </button>
    </div>
  );
}