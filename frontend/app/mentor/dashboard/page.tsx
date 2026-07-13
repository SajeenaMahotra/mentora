"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getMyProfile, getMyPackages } from "@/lib/actions/mentor";
import { toast } from "sonner";

interface Profile {
  fullname: string;
  bio: string | null;
  subjects: { _id: string; name: string }[];
  averageRating: number;
  ratingCount: number;
  emailVerified: boolean;
  isProfileSetup: boolean;
}

interface Package {
  _id: string;
}

export default function MentorDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyProfile(), getMyPackages()]).then(([profileRes, packagesRes]) => {
      if (profileRes.success) setProfile(profileRes.data);
      else toast.error(profileRes.message);

      if (packagesRes.success) setPackages(packagesRes.data || []);
      else toast.error(packagesRes.message);

      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3B5EFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const quickLinks = [
    { href: "/mentor/profile", label: "Edit profile", desc: "Update bio, subjects, and packages", icon: "👤" },
    { href: "/mentor/bookings", label: "Sessions", desc: "View booking requests", icon: "📅" },
    { href: "/mentor/messages", label: "Messages", desc: "Chat with learners", icon: "💬" },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back{profile?.fullname ? `, ${profile.fullname.split(" ")[0]}` : ""}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Here&apos;s an overview of your mentor account.</p>
        </div>
        {!profile?.emailVerified && (
          <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">
            Email not verified
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Rating
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {profile?.averageRating ? profile.averageRating.toFixed(1) : "—"}
            <span className="text-sm font-normal text-slate-400 ml-1">
              ({profile?.ratingCount ?? 0} reviews)
            </span>
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Packages
          </p>
          <p className="text-2xl font-bold text-slate-900">{packages.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Subjects
          </p>
          <p className="text-2xl font-bold text-slate-900">{profile?.subjects?.length ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Quick actions</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {quickLinks.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="rounded-xl border border-slate-100 p-4 hover:border-[#3B5EFF]/40 hover:bg-slate-50 transition"
            >
              <p className="text-xl mb-2">{q.icon}</p>
              <p className="text-sm font-medium text-slate-900">{q.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{q.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-3">Recent activity</h2>
        <p className="text-sm text-slate-400">
          No sessions yet. Once learners start booking, activity will show up here.
        </p>
      </div>
    </div>
  );
}