"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPasswordAction } from "@/lib/actions/auth";
import { resetPasswordSchema } from "@/lib/validations/auth";
import PasswordChecklist from "@/app/(auth)/_components/PasswordChecklist";
import PasswordInput from "@/app/(auth)/_components/PasswordInput";
import { toast } from "sonner";

type FieldErrors = Partial<Record<"password" | "confirmPassword", string>>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const token = searchParams.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = resetPasswordSchema.safeParse({ password, confirmPassword: confirm });
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    const res = await resetPasswordAction(token, result.data.password, result.data.confirmPassword);
    if (res.success) { toast.success("Password reset!"); router.push("/login"); }
    else toast.error(res.message);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8"><h1 className="text-3xl font-bold text-slate-900 mb-2">New password</h1><p className="text-slate-500">Choose a strong password.</p></div>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
          <PasswordInput
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
            error={!!errors.password}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
          ) : (
            <PasswordChecklist password={password} />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
          <PasswordInput
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
            error={!!errors.confirmPassword}
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
        </div>
        <button type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition">
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}