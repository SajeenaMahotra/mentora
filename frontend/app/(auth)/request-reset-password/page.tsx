"use client";
import { useState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { toast } from "sonner";

export default function RequestResetPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setError(undefined);
    setLoading(true);
    const res = await forgotPasswordAction(result.data.email);
    if (res.success) { setSent(true); toast.success("Reset link sent!"); }
    else toast.error(res.message);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Reset password</h1>
        <p className="text-slate-500">Enter your email and we&apos;ll send a reset link.</p>
      </div>
      {sent ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">📧</div>
          <p className="font-semibold text-green-700">Check your email!</p>
          <p className="text-green-600 text-sm mt-1">We sent a reset link to {email}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(undefined); }}
              placeholder="you@example.com"
              className={`w-full h-11 px-4 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                error ? "border-red-400 focus:ring-red-400" : "border-slate-200 focus:ring-blue-500"
              }`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
          <button type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}
      <p className="mt-5 text-center text-sm text-slate-600"><Link href="/login" className="text-blue-600 hover:underline">← Back to login</Link></p>
    </div>
    
  );
}