import { Clock } from "lucide-react";

export interface PackageItem {
  _id: string;
  title: string;
  description: string;
  price: number;
  durationValue: number;
  durationUnit: string;
  subject?: { _id: string; name: string; slug?: string };
  mentor?: { _id: string; fullname: string; profilePhoto?: string | null; bio?: string };
}

export default function PackageCard({ pkg, onClick }: { pkg: PackageItem; onClick: () => void }) {
  const name = pkg.mentor?.fullname || "Unknown";
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const photoUrl = pkg.mentor?.profilePhoto
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050"}/uploads/profile-photos/${pkg.mentor.profilePhoto}`
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col">
      <div className="p-5 flex flex-col flex-1">
        <p className="font-bold text-slate-900 text-base leading-snug mb-2">{pkg.title}</p>
        {pkg.subject && (
          <span className="inline-block self-start text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full mb-3">
            {pkg.subject.name}
          </span>
        )}

        {pkg.description && (
          <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">{pkg.description}</p>
        )}

        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px] flex-shrink-0 overflow-hidden">
            {photoUrl
              ? <img src={photoUrl} className="w-full h-full object-cover" alt={name} />
              : initials}
          </div>
          <span className="text-xs text-slate-400">{name}</span>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={13} /> {pkg.durationValue} {pkg.durationUnit}
            </span>
            <span className="font-bold text-slate-900 text-sm">NPR {pkg.price}</span>
          </div>
          <button onClick={onClick} className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition">
            View Package
          </button>
        </div>
      </div>
    </div>
  );
}