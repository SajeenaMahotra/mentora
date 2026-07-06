"use client";
import { useState } from "react";
import { toast } from "sonner";
import { createBookingAction } from "@/lib/actions/booking";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BookPackageButtonProps {
  packageId: string;
  packageTitle: string;
  packagePrice: number;
  durationValue: number;
  durationUnit: string;
  onSuccess?: () => void;
}

export default function BookPackageButton({
  packageId,
  packageTitle,
  packagePrice,
  durationValue,
  durationUnit,
  onSuccess,
}: BookPackageButtonProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    const res = await createBookingAction(packageId);
    setLoading(false);

    if (res.success) {
      toast.success("Booking request sent!");
      setSent(true);
      onSuccess?.();
    } else {
      toast.error(res.message);
    }
  };

  if (sent) {
    return (
      <button disabled className="w-full h-11 bg-slate-100 text-slate-400 font-semibold rounded-full cursor-not-allowed">
        Request Sent
      </button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition">
          Book This Package
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Booking Request</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-2">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Package</span>
                  <span className="font-semibold text-slate-900">{packageTitle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-semibold text-slate-900">{durationValue} {durationUnit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Price</span>
                  <span className="font-semibold text-slate-900">NPR {packagePrice}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Your request will be sent to the mentor. You can coordinate timing and details over chat once accepted.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Confirm Request"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}