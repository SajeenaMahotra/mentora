"use client";
import { useState, useEffect } from "react";
import { getAdminBookingsAction } from "@/lib/actions/admin";

interface Booking {
  _id: string; scheduled_at: string; address: string; status: string; price_per_hour: number;
  user?: { fullname: string; email?: string };
  provider?: { user?: { fullname: string }; category?: { category_name: string } };
}

const statusColors: Record<string,string> = {
  pending:"bg-yellow-50 text-yellow-700", accepted:"bg-blue-50 text-blue-700",
  completed:"bg-green-50 text-green-700", rejected:"bg-red-50 text-red-700", cancelled:"bg-slate-50 text-slate-500"
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getAdminBookingsAction().then(res => {
      if (res.success) setBookings(res.data?.data || res.data || []);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Bookings</h1>
          <p className="text-slate-500 text-sm mt-1">{bookings.length} total sessions</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {["all","pending","accepted","completed","rejected","cancelled"].map(s => (
            <option key={s} value={s}>{s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Learner", "Mentor", "Subject", "Date", "Format", "Price", "Status"].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({length:5}).map((_,i) => (
                <tr key={i} className="border-b border-slate-50">
                  {Array.from({length:7}).map((_,j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No bookings found</td></tr>
            ) : filtered.map(b => (
              <tr key={b._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                <td className="px-4 py-3 text-sm text-slate-700 font-medium">{b.user?.fullname || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{b.provider?.user?.fullname || "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{b.provider?.category?.category_name || "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(b.scheduled_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-xs text-slate-500 capitalize">{b.address}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700">NPR {b.price_per_hour}/hr</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[b.status]||""}`}>{b.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
