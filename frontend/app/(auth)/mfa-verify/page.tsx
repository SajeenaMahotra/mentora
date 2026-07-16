"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { mfaLoginVerifyAction } from "@/lib/actions/auth";
import { mfaCodeSchema } from "@/lib/validations/auth";
import { toast } from "sonner";

export default function MfaVerifyPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = sessionStorage.getItem("mfaTempToken");
    if (!t) {
      toast.error("Session expired, please log in again");
      router.push("/login");
      return;
    }
    setTempToken(t);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken) return;

    const result = mfaCodeSchema.safeParse({ code });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setError(undefined);

    setLoading(true);
    const res = await mfaLoginVerifyAction(tempToken, result.data.code);
    setLoading(false);

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    // --- NEW: password expired after MFA succeeded, redirect to force-change-password instead of logging in.
    if (res.passwordChangeRequired) {
      sessionStorage.removeItem("mfaTempToken");
      sessionStorage.setItem("passwordChangeTempToken", res.tempToken);
      router.push("/force-change-password");
      return;
    }

    sessionStorage.removeItem("mfaTempToken");
    toast.success("Welcome back!");
    login(res.data);
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Two-factor verification</h1>
        <p className="text-slate-500">Enter the 6-digit code from your authenticator app, or a recovery code.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); if (error) setError(undefined); }}
            autoFocus
            placeholder="123456"
            maxLength={10}
            className={`w-full h-11 px-4 border rounded-xl text-sm tracking-widest text-center focus:outline-none focus:ring-2 ${error ? "border-red-400 focus:ring-red-400" : "border-slate-200 focus:ring-blue-500"
              }`}
          />
          {error && <p className="mt-1 text-xs text-red-500 text-center">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={loading || !tempToken}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
}