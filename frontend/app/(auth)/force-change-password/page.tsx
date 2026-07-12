"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { forceChangePasswordAction } from "@/lib/actions/auth";
import { forceChangePasswordSchema } from "@/lib/validations/auth";
import PasswordInput from "@/app/(auth)/_components/PasswordInput";
import { toast } from "sonner";

export default function ForceChangePasswordPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = sessionStorage.getItem("passwordChangeTempToken");
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

    const result = forceChangePasswordSchema.safeParse({ password, confirmPassword });
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

    setLoading(true);
    const res = await forceChangePasswordAction(tempToken, result.data.password, result.data.confirmPassword);
    setLoading(false);

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    sessionStorage.removeItem("passwordChangeTempToken");
    toast.success("Password updated. Welcome back!");
    login(res.token, res.data);
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Set a new password</h1>
        <p className="text-slate-500">Your password has expired. Choose a new one to continue.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
          <PasswordInput
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
            placeholder="••••••••"
            error={!!errors.password}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm new password</label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
            placeholder="••••••••"
            error={!!errors.confirmPassword}
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
        </div>
        <button
          type="submit"
          disabled={loading || !tempToken}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}