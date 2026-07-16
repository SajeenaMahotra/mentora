import { useEffect, useState } from "react";
import { Clock, Star } from "lucide-react";
import api from "@/lib/api/axios";
import { ENDPOINTS } from "@/lib/api/endpoints";

export interface PackageItem {
  _id: string;
  title: string;
  description: string;
  price: number;
  durationValue: number;
  durationUnit: string;
  subject?: { _id: string; name: string; slug?: string };
  mentor?: {
    _id: string;
    fullname: string;
    profilePhoto?: string | null;
    bio?: string;
    averageRating?: number;
    ratingCount?: number;
  };
}

// --- NEW: fetches the mentor's photo through the authenticated API (cookie sent
// automatically) and turns it into a blob URL, instead of pointing <img> straight
// at the backend's static file path, which the CORP/same-site policy blocks.
function useMentorPhoto(mentorId: string | undefined, hasPhoto: boolean) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!mentorId || !hasPhoto) {
      setBlobUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    api
      .get(ENDPOINTS.USER_PHOTO(mentorId), { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setBlobUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mentorId, hasPhoto]);

  return blobUrl;
}

export default function PackageCard({ pkg, onClick }: { pkg: PackageItem; onClick: () => void }) {
  const name = pkg.mentor?.fullname || "Unknown";
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const photoUrl = useMentorPhoto(pkg.mentor?._id, !!pkg.mentor?.profilePhoto);
  const ratingCount = pkg.mentor?.ratingCount ?? 0;
  const averageRating = pkg.mentor?.averageRating ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col">
      <div className="p-5 flex flex-col flex-1">
        <p className="font-bold text-slate-900 text-base leading-snug mb-2 line-clamp-2 min-h-[2.75rem]">{pkg.title}</p>
        {pkg.subject && (
          <span className="inline-block self-start text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full mb-3">
            {pkg.subject.name}
          </span>
        )}

        {pkg.description && (
          <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4 min-h-[2.5rem]">{pkg.description}</p>
        )}

        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px] flex-shrink-0 overflow-hidden">
            {photoUrl
              ? <img src={photoUrl} className="w-full h-full object-cover" alt={name} />
              : initials}
          </div>
          <span className="text-xs text-slate-400">{name}</span>
        </div>

        <div className="h-5 mb-3 ml-8 flex items-center">
          {ratingCount > 0 && (
            <div className="flex items-center gap-1">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-slate-700">{averageRating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">({ratingCount} review{ratingCount !== 1 ? "s" : ""})</span>
            </div>
          )}
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