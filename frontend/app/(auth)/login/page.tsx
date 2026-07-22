"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { loginAction } from "@/lib/actions/auth";
import { loginSchema } from "@/lib/validations/auth";
import Recaptcha from "@/app/(auth)/_components/Recaptcha";
import PasswordInput from "@/app/(auth)/_components/PasswordInput";
import Logo from "@/components/Logo";
import { toast } from "sonner";
import type ReCAPTCHA from "react-google-recaptcha";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof typeof errors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (!captchaToken) {
      toast.error("Please complete the captcha");
      return;
    }

    setLoading(true);
    const res = await loginAction(result.data.email, result.data.password, captchaToken);

    if (!res.success) {
      toast.error(res.message);
      // --- NEW: clear the password field on failed login — don't leave a wrong/stale credential sitting visible.
      setPassword("");
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
      setLoading(false);
      return;
    }

    if (res.mfaRequired) {
      sessionStorage.setItem("mfaTempToken", res.tempToken);
      router.push("/mfa-verify");
      return;
    }

    if (res.passwordChangeRequired) {
      sessionStorage.setItem("passwordChangeTempToken", res.tempToken);
      router.push("/force-change-password");
      return;
    }

    toast.success("Welcome back!");
    login(res.data);
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <Logo className="mb-6 md:hidden" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back!</h1>
        <p className="text-slate-500">Sign in to continue your learning journey.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input
            type="text"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
            placeholder="you@example.com"
            className={`w-full h-11 px-4 border rounded-xl text-sm focus:outline-none focus:ring-2 ${errors.email ? "border-red-400 focus:ring-red-400" : "border-slate-200 focus:ring-blue-500"
              }`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <PasswordInput
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
            placeholder="••••••••"
            error={!!errors.password}
          />
          <div className="flex justify-between items-start mt-1.5">
            {errors.password ? (
              <p className="text-xs text-red-500">{errors.password}</p>
            ) : (
              <span />
            )}
            <Link href="/request-reset-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
          </div>
        </div>

        <Recaptcha ref={recaptchaRef} onChange={setCaptchaToken} />

        <button type="submit" disabled={loading}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">OR</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <a
        href={`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:5050"}/api/auth/google`}
        className="w-full h-11 flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-slate-300 rounded-xl font-semibold text-sm text-slate-700 transition"
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path fill="#4285F4" d="M19.6 10.23c0-.68-.06-1.36-.17-2H10v3.79h5.4a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.75 3-4.32 3-7.31Z" />
          <path fill="#34A853" d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.23-2.5c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H1.06v2.59A10 10 0 0 0 10 20Z" />
          <path fill="#FBBC05" d="M4.4 11.92a6 6 0 0 1 0-3.84V5.49H1.06a10 10 0 0 0 0 9.02l3.34-2.59Z" />
          <path fill="#EA4335" d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 10 0 10 10 0 0 0 1.06 5.49L4.4 8.08C5.2 5.72 7.4 3.96 10 3.96Z" />
        </svg>
        Continue with Google
      </a>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account? <Link href="/role-selection" className="font-semibold text-blue-600 hover:underline">Create one</Link>
      </p>
    </div>
  );
}