"use client";
import { Suspense, useState, useEffect } from "react";
import { getBookingsForLearnerAction, cancelBookingAction, checkoutBookingAction, raiseDisputeAction } from "@/lib/actions/booking";
import { createReviewAction, getMyReviewedBookingIdsAction } from "@/lib/actions/review";
import { toast } from "sonner";
import { Calendar, Package as PackageIcon, Star } from "lucide-react";
import StatusBadge from "../../../components/StatusBadge";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle } from "lucide-react";

interface Booking {
  _id: string;
  packageTitle: string;
  packagePrice: number;
  sessionType: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "paid" | "completed" | "disputed";
  createdAt: string;
  disputeDeadline?: string;
  mentor?: { _id: string; fullname: string; profilePhoto?: string | null };
}

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
  { key: "cancelled", label: "Cancelled" },
  { key: "paid", label: "Paid" },
  { key: "completed", label: "Completed" },
  { key: "disputed", label: "Disputed" },
] as const;

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5"
        >
          <Star
            size={26}
            className={(hover || value) >= n ? "fill-amber-400 text-amber-400" : "text-slate-300"}
          />
        </button>
      ))}
    </div>
  );
}

function BookingsPageContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentDialog, setPaymentDialog] = useState<"success" | "cancelled" | null>(null);

  const [disputeReason, setDisputeReason] = useState("");
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = (status?: string) => {
    setLoading(true);
    getBookingsForLearnerAction(status && status !== "all" ? { status } : undefined).then((res) => {
      if (res.success) setBookings(res.data?.items || []);
      else toast.error(res.message);
      setLoading(false);
    });
  };

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success" || payment === "cancelled") {
      setPaymentDialog(payment);
      router.replace("/bookings");
    }
  }, [searchParams, router]);

  useEffect(() => {
    load(activeTab);
  }, [activeTab]);

  useEffect(() => {
    getMyReviewedBookingIdsAction().then((res) => {
      if (res.success) setReviewedBookingIds(new Set(res.data));
    });
  }, []);

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

  const handleRaiseDispute = async (id: string) => {
    if (disputeReason.trim().length < 10) {
      toast.error("Please provide a more detailed reason (at least 10 characters)");
      return;
    }
    setSubmittingDispute(true);
    const res = await raiseDisputeAction(id, disputeReason);
    setSubmittingDispute(false);
    if (res.success) {
      toast.success("Dispute raised. Our admin team will review it.");
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: "disputed" } : b)));
      setDisputingId(null);
      setDisputeReason("");
    } else {
      toast.error(res.message);
    }
  };

  const handleSubmitReview = async (id: string) => {
    if (reviewRating < 1) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmittingReview(true);
    const res = await createReviewAction(id, {
      rating: reviewRating,
      comment: reviewComment.trim() || undefined,
    });
    setSubmittingReview(false);
    if (res.success) {
      toast.success("Review submitted, thanks!");
      setReviewedBookingIds((prev) => new Set(prev).add(id));
      setReviewingId(null);
      setReviewRating(0);
      setReviewComment("");
    } else {
      toast.error(res.message);
    }
  };

  const isDisputeWindowOpen = (b: Booking) =>
    b.status === "completed" && !!b.disputeDeadline && new Date() < new Date(b.disputeDeadline);

  const canReview = (b: Booking) => b.status === "completed" && !reviewedBookingIds.has(b._id);

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
                  {isDisputeWindowOpen(b) && (
                    <Dialog open={disputingId === b._id} onOpenChange={(open) => setDisputingId(open ? b._id : null)}>
                      <DialogTrigger asChild>
                        <button className="text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition">
                          Raise Dispute
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Raise a Dispute</DialogTitle>
                          <DialogDescription>
                            Tell us what went wrong with this session. Our admin team will review and may issue a refund.
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          placeholder="e.g. The mentor never joined the session..."
                          rows={4}
                        />
                        <DialogFooter>
                          <button
                            onClick={() => handleRaiseDispute(b._id)}
                            disabled={submittingDispute}
                            className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
                          >
                            {submittingDispute ? "Submitting..." : "Submit Dispute"}
                          </button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  {canReview(b) && (
                    <Dialog
                      open={reviewingId === b._id}
                      onOpenChange={(open) => {
                        setReviewingId(open ? b._id : null);
                        if (!open) {
                          setReviewRating(0);
                          setReviewComment("");
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <button className="text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-300 text-amber-600 hover:bg-amber-50 transition">
                          Leave a Review
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rate your session</DialogTitle>
                          <DialogDescription>
                            How was your session with {b.mentor?.fullname || "your mentor"} for "{b.packageTitle}"?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-2">
                          <StarRatingInput value={reviewRating} onChange={setReviewRating} />
                        </div>
                        <Textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Optional: share more about your experience..."
                          rows={4}
                        />
                        <DialogFooter>
                          <button
                            onClick={() => handleSubmitReview(b._id)}
                            disabled={submittingReview}
                            className="px-4 py-2 rounded-full bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition"
                          >
                            {submittingReview ? "Submitting..." : "Submit Review"}
                          </button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!paymentDialog} onOpenChange={() => setPaymentDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {paymentDialog === "success" ? (
                <>
                  <CheckCircle2 className="text-green-600" size={22} /> Payment Successful
                </>
              ) : (
                <>
                  <XCircle className="text-red-500" size={22} /> Payment Cancelled
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {paymentDialog === "success"
                ? "Your payment has gone through. The booking is now marked as paid - you can coordinate session details with your mentor over chat."
                : "The payment was cancelled. You can try again anytime from your accepted bookings."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setPaymentDialog(null)}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BookingsPageContent />
    </Suspense>
  );
}