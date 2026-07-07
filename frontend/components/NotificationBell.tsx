"use client";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/lib/hooks/useNotifications";

export default function NotificationBell() {
  const { notifications, unreadCount, loading, markAllRead, markOneRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition">
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                <div className="text-3xl mb-2">🔔</div>No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div key={n._id} onClick={() => !n.is_read && markOneRead(n._id)}
                  className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition ${!n.is_read ? "bg-blue-50/50" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? "bg-blue-500" : "bg-slate-200"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
