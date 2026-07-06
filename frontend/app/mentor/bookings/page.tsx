"use client";
import { useState, useEffect } from "react";
import { getBookingsForMentorAction, acceptBookingAction, declineBookingAction, markCompleteAction } from "@/lib/actions/booking";
import { toast } from "sonner";
import { Calendar, Package as PackageIcon, Check, X } from "lucide-react";
import StatusBadge from "../../../components/StatusBadge";
import MessageLearnerButton from "@/components/MessageLearnerButton";

interface Booking {
  _id: string;
  packageTitle: string;
  packagePrice: number;
  sessionType: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "paid" | "completed";
  createdAt: string;
  learner?: { _id: string; fullname: string; profilePhoto?: string | null };
}

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
  { key: "paid", label: "Paid" },
  { key: "completed", label: "Completed" },
] as const;

export default function MentorBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = (status?: string) => {
    setLoading(true);
    getBookingsForMentorAction(status && status !== "all" ? { status } : undefined).then((res) => {
      if (res.success) setBookings(res.data?.items || []);
      else toast.error(res.message);
      setLoading(false);
    });
  };

  useEffect(() => {
    load(activeTab);
  }, [activeTab]);

  const handleAccept = async (id: string) => {
    setActingOn(id);
    const res = await acceptBookingAction(id);
    setActingOn(null);
    if (res.success) {
      toast.success("Booking accepted");
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: "accepted" } : b)));
    } else {
      toast.error(res.message);
    }
  };

  const handleDecline = async (id: string) => {
    setActingOn(id);
    const res = await declineBookingAction(id);
    setActingOn(null);
    if (res.success) {
      toast.success("Booking declined");
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: "declined" } : b)));
    } else {
      toast.error(res.message);
    }
  };

  const handleMarkComplete = async (id: string) => {
    setActingOn(id);
    const res = await markCompleteAction(id);
    setActingOn(null);
    if (res.success) {
      toast.success("Marked as completed");
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: "completed" } : b)));
    } else {
      toast.error(res.message);
    }
  };

  const photoUrl = (photo?: string | null) =>
    photo ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050"}/uploads/profile-photos/${photo}` : null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Booking Requests</h1>
      <p className="text-slate-500 text-sm mb-6">Manage booking requests from learners.</p>

      <div className="flex gap-1 mb-6 border-b border-slate-100">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === tab.key
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
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Calendar size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-400">No booking requests here yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const photo = photoUrl(b.learner?.profilePhoto);
            const initials = (b.learner?.fullname || "L").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const isActing = actingOn === b._id;
            return (
              <div key={b._id} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0 overflow-hidden">
                    {photo ? <img src={photo} className="w-full h-full object-cover" alt="" /> : initials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{b.learner?.fullname || "Learner"}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <PackageIcon size={12} /> {b.packageTitle}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 capitalize">{b.sessionType} · Requested {new Date(b.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={b.status} />
                  <p className="text-sm font-bold text-slate-700">NPR {b.packagePrice}</p>
                  <div className="flex gap-2">
                    <MessageLearnerButton
                      learnerId={b.learner!._id}
                      learnerFullname={b.learner?.fullname || "Learner"}
                      learnerPhoto={b.learner?.profilePhoto ?? undefined}
                    />
                    {b.status === "pending" && (
                      <>
                        <button onClick={() => handleDecline(b._id)} disabled={isActing} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition">
                          <X size={12} /> Decline
                        </button>
                        <button onClick={() => handleAccept(b._id)} disabled={isActing} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition">
                          <Check size={12} /> Accept
                        </button>
                      </>
                    )}
                    {b.status === "paid" && (
                      <button
                        onClick={() => handleMarkComplete(b._id)}
                        disabled={isActing}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        <Check size={12} /> Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}