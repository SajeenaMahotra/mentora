"use client";
import Link from "next/link";
export default function GoogleErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Google Sign In Failed</h1>
        <p className="text-slate-500 mb-6">Something went wrong. Please try again.</p>
        <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition">Back to Login</Link>
      </div>
    </div>
  );
}
