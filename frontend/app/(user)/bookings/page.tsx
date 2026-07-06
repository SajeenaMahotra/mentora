"use client";
import { useState, useEffect } from "react";
import { getBookingsForLearnerAction, cancelBookingAction, checkoutBookingAction } from "@/lib/actions/booking";
import { toast } from "sonner";
import { Calendar, Package as PackageIcon } from "lucide-react";
import StatusBadge from "../../../components/StatusBadge";

interface Booking {
  _id: string;
  packageTitle: string;
  packagePrice: number;
  sessionType: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "paid";
  createdAt: string;
  mentor?: { _id: string; fullname: string; profilePhoto?: string | null };
}

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
  { key: "cancelled", label: "Cancelled" },
  { key: "paid", label: "Paid" },
] as const;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  const load = (status?: string) => {
    setLoading(true);
    getBookingsForLearnerAction(status && status !== "all" ? { status } : undefined).then((res) => {
      if (res.success) setBookings(res.data?.items || []);
      else toast.error(res.message);
      setLoading(false);
    });
  };

  useEffect(() => {
    load(activeTab);
  }, [activeTab]);

  const handleCancel = async (id: string) => {
    const res = await cancelBookingAction(id);
    if (res.success) {
      toast.success("Booking cancelled");
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b)));
    } else {
      toast.error(res.message);
    }
  };

  const handlePay = async (id: string) => {
    const res = await checkoutBookingAction(id);
    if (res.success && res.data?.checkoutUrl) {
      window.location.href = res.data.checkoutUrl;
    } else {
      toast.error(res.message || "Failed to start payment");
    }
  };

  const photoUrl = (photo?: string | null) =>
    photo ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050"}/uploads/profile-photos/${photo}` : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">My Bookings</h1>
      <p className="text-slate-500 text-sm mb-6">Track your booking requests to mentors.</p>

      <div className="flex gap-1 mb-6 border-b border-slate-100">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Calendar size={40} className="mx-auto mb-3 text-slate-300" />
          <p>No bookings here yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const photo = photoUrl(b.mentor?.profilePhoto);
            const initials = (b.mentor?.fullname || "M").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div key={b._id} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0 overflow-hidden">
                    {photo ? <img src={photo} className="w-full h-full object-cover" alt="" /> : initials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{b.mentor?.fullname || "Mentor"}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <PackageIcon size={12} /> {b.packageTitle}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 capitalize">{b.sessionType} · Requested {new Date(b.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={b.status} />
                  <p className="text-sm font-bold text-slate-700">NPR {b.packagePrice}</p>
                  {b.status === "pending" && (
                    <button onClick={() => handleCancel(b._id)} className="text-xs text-red-500 hover:underline">
                      Cancel
                    </button>
                  )}
                  {b.status === "accepted" && (
                    <button
                      onClick={() => handlePay(b._id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}