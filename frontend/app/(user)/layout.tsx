"use client";
import Link from "next/link";
import { useAuth } from "@/context/authContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Home, CalendarCheck, MessageSquare, User, LogOut, ChevronDown } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const nav = [
    { href: "/feed", label: "Home", icon: Home },
    { href: "/browsementor", label: "Find Mentors", icon: User },
    { href: "/bookings", label: "Sessions", icon: CalendarCheck },
    { href: "/message", label: "Messages", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/feed" className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-xl text-white">Mentor<span className="text-indigo-400">a</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {nav.map(n => {
              const active = pathname === n.href;
              const Icon = n.icon;
              return (
                <Link key={n.href} href={n.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    active ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}>
                  <Icon size={16} />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <NotificationBell />

            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-800 transition">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                  {user?.fullname?.[0]?.toUpperCase() || "U"}
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.fullname}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <Link href="/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                    <User size={15} /> Profile
                  </Link>
                  <button onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="md:hidden flex items-center justify-around border-t border-slate-800 h-14">
          {nav.map(n => {
            const active = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${active ? "text-indigo-400" : "text-slate-400"}`}>
                <Icon size={18} />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}