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
    login(res.token, res.data);
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
            className={`w-full h-11 px-4 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
              errors.email ? "border-red-400 focus:ring-red-400" : "border-slate-200 focus:ring-blue-500"
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

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account? <Link href="/role-selection" className="font-semibold text-blue-600 hover:underline">Create one</Link>
      </p>
    </div>
  );
}