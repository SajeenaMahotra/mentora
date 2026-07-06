"use client";

import { useEffect, useState, useCallback } from "react";
import { getAdminDisputesAction, refundDisputeAction, rejectDisputeAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle2, MoreVertical, XCircle } from "lucide-react";

interface DisputeBooking {
    _id: string;
    packageTitle: string;
    packagePrice: number;
    disputeReason?: string;
    disputedAt?: string;
    learner?: { fullname: string; email: string };
    mentor?: { fullname: string; email: string };
}

type PendingAction = { type: "refund" | "reject"; booking: DisputeBooking } | null;

export default function AdminDisputesPage() {
    const [disputes, setDisputes] = useState<DisputeBooking[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(20);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<string | null>(null);
    const [pending, setPending] = useState<PendingAction>(null);
    const [error, setError] = useState("");
    const [resultDialog, setResultDialog] = useState<"refunded" | "rejected" | null>(null);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getAdminDisputesAction({ page, limit });
        if (res.success) {
            setDisputes(res.data.items);
            setTotal(res.data.total);
        }
        setLoading(false);
    }, [page, limit]);

    useEffect(() => {
        load();
    }, [load]);

    async function confirmAction() {
        if (!pending) return;
        const { type, booking } = pending;
        setActingId(booking._id);
        setError("");

        const res = type === "refund" ? await refundDisputeAction(booking._id) : await rejectDisputeAction(booking._id);

        if (res.success) {
            load();
            setResultDialog(type === "refund" ? "refunded" : "rejected");
        } else {
            setError(res.message || "Something went wrong");
        }

        setActingId(null);
        setPending(null);
    }

    return (
        <div>
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Disputes</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {loading ? "Loading..." : `${total} ${total === 1 ? "dispute" : "disputes"} pending review`}
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-3 py-3 font-medium">Learner</th>
                            <th className="px-3 py-3 font-medium">Mentor</th>
                            <th className="px-3 py-3 font-medium">Package</th>
                            <th className="px-3 py-3 font-medium">Reason</th>
                            <th className="px-3 py-3 font-medium">Amount</th>
                            <th className="px-3 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-14 text-center text-sm text-slate-400">
                                    Loading disputes...
                                </td>
                            </tr>
                        ) : disputes.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-14 text-center text-sm text-slate-400">
                                    No open disputes.
                                </td>
                            </tr>
                        ) : (
                            disputes.map((d) => (
                                <tr key={d._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 align-top">
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <p className="font-medium text-slate-900 text-sm">{d.learner?.fullname}</p>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <p className="font-medium text-slate-900 text-sm">{d.mentor?.fullname}</p>
                                    </td>
                                    <td className="px-3 py-3 text-slate-700 text-sm whitespace-nowrap">{d.packageTitle}</td>
                                    <td className="px-3 py-3 text-slate-600 text-sm" style={{ maxWidth: 220 }}>
                                        <span className="block truncate" title={d.disputeReason}>{d.disputeReason}</span>
                                    </td>
                                    <td className="px-3 py-3 font-semibold text-slate-900 text-sm whitespace-nowrap">NPR {d.packagePrice}</td>
                                    <td className="px-3 py-3 text-right whitespace-nowrap">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="sm" variant="outline" disabled={actingId === d._id}>
                                                    <MoreVertical size={14} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setPending({ type: "reject", booking: d })}>
                                                    Reject
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setPending({ type: "refund", booking: d })}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    Refund
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                            Previous
                        </Button>
                        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                            Next
                        </Button>
                    </div>
                </div>
            )}

            <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pending?.type === "refund" ? "Refund this booking?" : "Reject this dispute?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pending?.type === "refund"
                                ? "This will process a real Stripe refund for the learner and cannot be undone."
                                : "The dispute will be dismissed and the booking will return to completed status. No refund will be issued."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmAction}
                            className={pending?.type === "refund" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}
                        >
                            {pending?.type === "refund" ? "Refund" : "Reject"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!resultDialog} onOpenChange={() => setResultDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            {resultDialog === "refunded" ? (
                                <>
                                    <CheckCircle2 className="text-green-600" size={22} /> Refund Processed
                                </>
                            ) : (
                                <>
                                    <XCircle className="text-slate-500" size={22} /> Dispute Rejected
                                </>
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {resultDialog === "refunded"
                                ? "The refund was successfully processed through Stripe. The learner will see the amount returned to their card."
                                : "The dispute was rejected. The booking has returned to completed status and no refund was issued."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setResultDialog(null)}>Got it</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}