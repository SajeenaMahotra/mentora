"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function GoogleErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Google Sign In Failed</h1>
        <p className="text-slate-500 mb-6">
          {message || "Something went wrong. Please try again."}
        </p>
        <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function GoogleErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <GoogleErrorContent />
    </Suspense>
  );
}