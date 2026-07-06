"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getPackagesAction } from "@/lib/actions/mentor";
import { toast } from "sonner";
import { ArrowLeft, Clock, Package as PackageIcon, ShieldCheck, Layers, Check } from "lucide-react";
import MessageMentorButton from "../../../../components/MessageMentorButton";
import BookPackageButton from "../../_components/BookPackageButton";

interface PackageItem {
  _id: string;
  title: string;
  description: string;
  price: number;
  durationValue: number;
  durationUnit: string;
  sessionType: string;
  subject?: { _id: string; name: string };
  mentor?: { _id: string; fullname: string; profilePhoto?: string | null; bio?: string };
}

export default function MentorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PackageItem | null>(null);

  useEffect(() => {
    getPackagesAction({ mentor: id }).then(res => {
      if (res.success) {
        const list = res.data || [];
        setPackages(list);
        setSelected(list[0] || null);
      }
      setLoading(false);
    });
  }, [id]);


  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (packages.length === 0) return (
    <div className="text-center py-20 text-slate-400">This mentor has no packages yet.</div>
  );

  const mentor = packages[0].mentor;
  const photoUrl = mentor?.profilePhoto
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050"}/uploads/profile-photos/${mentor.profilePhoto}`
    : null;
  const name = mentor?.fullname || "Unknown";
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const subjects = Array.from(new Set(packages.map(p => p.subject?.name).filter(Boolean)));

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-indigo-600 mb-6 flex items-center gap-1.5 font-medium">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: info */}
        <div className="lg:col-span-2 space-y-5">

          {/* Profile header */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl flex-shrink-0 overflow-hidden">
                {photoUrl ? <img src={photoUrl} className="w-full h-full object-cover" alt={name} /> : initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{name}</h1>
                  <ShieldCheck size={17} className="text-indigo-500" />
                </div>
                <p className="text-sm text-slate-400 mt-0.5">Verified Mentor</p>
              </div>
              {mentor && (
                <MessageMentorButton
                  mentorId={mentor._id}
                  mentorFullname={mentor.fullname}
                  mentorPhoto={photoUrl ?? undefined}
                />
              )}
            </div>

            <div className="flex gap-3 mb-5">
              <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-2.5">
                <Layers size={16} className="text-indigo-500" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{packages.length}</p>
                  <p className="text-[11px] text-slate-400 leading-tight">Package{packages.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-2.5">
                <PackageIcon size={16} className="text-indigo-500" />
                <div>
                  <p className="text-sm font-bold text-slate-900 truncate">{subjects.slice(0, 2).join(", ") || "General"}</p>
                  <p className="text-[11px] text-slate-400 leading-tight">Teaches</p>
                </div>
              </div>
            </div>

            {mentor?.bio && (
              <>
                <h3 className="font-semibold text-slate-900 text-sm mb-2">About</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{mentor.bio}</p>
              </>
            )}
          </div>

          {/* Packages */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Packages</h3>
            <div className="space-y-3">
              {packages.map(p => {
                const active = selected?._id === p._id;
                return (
                  <button key={p._id} onClick={() => setSelected(p)}
                    className={`w-full text-left p-4 rounded-xl border transition ${active ? "border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-100" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="font-semibold text-slate-900 text-sm">{p.title}</p>
                          {active && <Check size={14} className="text-indigo-600 shrink-0" />}
                        </div>
                        {p.subject && <span className="inline-block text-xs font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full mb-2">{p.subject.name}</span>}
                        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-2">{p.description}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock size={12} /> {p.durationValue} {p.durationUnit} · {p.sessionType}
                        </div>
                      </div>
                      <span className="shrink-0 font-bold text-slate-800 text-sm">NPR {p.price}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: booking */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden h-fit sticky top-24 shadow-sm">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white">
            <p className="text-xs font-semibold text-indigo-300 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
              <PackageIcon size={12} /> Selected Package
            </p>
            <p className="font-bold text-lg leading-snug mb-3">{selected?.title}</p>
            <p className="text-3xl font-bold">NPR {selected?.price}</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="text-sm space-y-2.5">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Duration</span>
                <span className="font-semibold text-slate-800">{selected?.durationValue} {selected?.durationUnit}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Format</span>
                <span className="font-semibold text-slate-800 capitalize">{selected?.sessionType}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Subject</span>
                <span className="font-semibold text-slate-800">{selected?.subject?.name || "—"}</span>
              </div>
            </div>
            {selected && (
              <BookPackageButton
                packageId={selected._id}
                packageTitle={selected.title}
                packagePrice={selected.price}
                durationValue={selected.durationValue}
                durationUnit={selected.durationUnit}
              />
            )}
            <p className="text-xs text-slate-400 text-center leading-relaxed">Chat with the mentor before booking to confirm details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}