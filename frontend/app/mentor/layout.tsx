"use client";
import Link from "next/link";
import { useAuth } from "@/context/authContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import NotificationBell from "@/components/NotificationBell";
import LogoutConfirmDialog from "@/components/LogoutConfirmDialog";

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-sm text-slate-400">
        Loading...
      </div>
    );
  }

  if (isSetupPage) return <>{children}</>;

  const nav = [
    { href: "/mentor/dashboard", label: "Dashboard" },
    { href: "/mentor/bookings", label: "Sessions" },
    { href: "/mentor/messages", label: "Messages" },
    { href: "/mentor/profile", label: "Profile" },
    { href: "/mentor/settings", label: "Settings" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950">
        <div className="border-b border-white/10 px-6 py-6">
          <Link href="/mentor/dashboard" className="text-xl font-bold tracking-tight text-white">
            Mentor<span className="text-indigo-400">a</span>
          </Link>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">
            Mentor Panel
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map(({ href, label }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/40"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <Link
            href="/mentor/settings"
            className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-300 overflow-hidden">
              {user?.profilePhoto ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050"}/uploads/profile-photos/${user.profilePhoto}`}
                  className="w-full h-full object-cover"
                  alt={user.fullname}
                />
              ) : (
                user?.fullname
                  ?.split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.fullname}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </Link>
          <LogoutConfirmDialog
            onConfirm={logout}
            trigger={
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
                Log out
              </button>
            }
          />
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-end border-b border-slate-200 bg-white px-6">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}