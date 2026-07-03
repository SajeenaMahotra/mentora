"use client";
import Link from "next/link";
import { useAuth } from "@/context/authContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isSetupPage = pathname === "/mentor/setup-profile";

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || user?.role !== "mentor") {
      router.push("/login");
      return;
    }

    if (!user.isProfileSetup && !isSetupPage) {
      router.push("/mentor/setup-profile");
      return;
    }

    if (user.isProfileSetup && isSetupPage) {
      router.push("/mentor/dashboard");
    }
  }, [loading, isAuthenticated, user, isSetupPage, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  // setup-profile renders standalone, no sidebar
  if (isSetupPage) return <>{children}</>;

  const nav = [
    { href: "/mentor/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/mentor/bookings", label: "Sessions", icon: "📅" },
    { href: "/mentor/messages", label: "Messages", icon: "💬" },
    { href: "/mentor/profile", label: "Profile", icon: "👤" },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100">
          <Link href="/mentor/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">M</span></div>
            <span className="font-bold text-xl text-slate-900">Mentor<span className="text-blue-600">a</span></span>
          </Link>
          <p className="text-xs text-slate-400 mt-3 uppercase tracking-wide font-semibold">Mentor Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(n => (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${pathname===n.href ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}>
              <span>{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
              {user?.fullname?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.fullname}</p>
              <p className="text-xs text-slate-400">Mentor</p>
            </div>
          </div>
          <button onClick={logout} className="w-full text-xs text-slate-500 hover:text-red-500 transition text-left">Sign out</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}