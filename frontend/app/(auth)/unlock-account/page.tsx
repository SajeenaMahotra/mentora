"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { unlockAccountAction } from "@/lib/actions/auth";
import Logo from "@/components/Logo";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function UnlockAccountContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing unlock token. Please use the link from your email.");
      return;
    }

    unlockAccountAction(token).then((res) => {
      if (res.success) {
        setStatus("success");
        setMessage("Your account has been unlocked. You can now log in.");
      } else {
        setStatus("error");
        setMessage(res.message || "This unlock link is invalid or has expired.");
      }
    });
  }, [searchParams]);

  return (
    <div className="w-full max-w-md text-center">
      <Logo className="mb-6 mx-auto md:hidden" />

      {status === "loading" && (
        <>
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Unlocking your account...</h1>
          <p className="text-slate-500">Please wait a moment.</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Unlocked</h1>
          <p className="text-slate-500 mb-6">{message}</p>
          <Link
            href="/login"
            className="inline-block w-full h-11 leading-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
          >
            Go to Login
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Unlock Failed</h1>
          <p className="text-slate-500 mb-6">{message}</p>
          <Link
            href="/login"
            className="inline-block w-full h-11 leading-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
          >
            Back to Login
          </Link>
        </>
      )}
    </div>
  );
}

export default function UnlockAccountPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    }>
      <UnlockAccountContent />
    </Suspense>
  );
}