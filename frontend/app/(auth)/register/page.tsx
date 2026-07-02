"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { registerAction } from "@/lib/actions/auth";
import { registerSchema } from "@/lib/validations/auth";
import Recaptcha from "@/app/(auth)/_components/Recaptcha";
import PasswordChecklist from "@/app/(auth)/_components/PasswordChecklist";
import PasswordInput from "@/app/(auth)/_components/PasswordInput";
import Logo from "@/components/Logo";
import { toast } from "sonner";
import type ReCAPTCHA from "react-google-recaptcha";

type Role = "learner" | "mentor";
type FieldErrors = Partial<Record<"fullname" | "email" | "password" | "confirmPassword", string>>;

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [form, setForm] = useState({ fullname: "", email: "", password: "", confirmPassword: "", role: "learner" as Role });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    setForm((f) => ({ ...f, role: roleParam === "mentor" ? "mentor" : "learner" }));
  }, [searchParams]);

  const roleLabel = form.role === "mentor" ? "Mentor" : "Learner";

  const update = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as keyof FieldErrors]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = registerSchema.safeParse(form);
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

    if (!captchaToken) {
      toast.error("Please complete the captcha");
      return;
    }

    setLoading(true);
    const res = await registerAction({ ...result.data, captchaToken });
    setLoading(false);

    if (res.success) {
      toast.success("Account created! Please sign in.");
      router.push("/login");
    } else {
      toast.error(res.message);
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    }
  };

  const fields: { label: string; key: keyof typeof form; type: string; placeholder: string }[] = [
    { label: "Full Name", key: "fullname", type: "text", placeholder: "John Doe" },
    { label: "Email", key: "email", type: "text", placeholder: "you@example.com" },
    { label: "Password", key: "password", type: "password", placeholder: "Min. 12 characters" },
    { label: "Confirm Password", key: "confirmPassword", type: "password", placeholder: "••••••••" },
  ];

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <Logo className="mb-6 md:hidden" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create your account</h1>
        <p className="text-slate-500">Joining as a <span className="font-semibold text-blue-600">{roleLabel}</span></p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {fields.map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
            {type === "password" ? (
              <PasswordInput
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                error={!!errors[key as keyof FieldErrors]}
              />
            ) : (
              <input
                type={type}
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                className={`w-full h-11 px-4 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                  errors[key as keyof FieldErrors] ? "border-red-400 focus:ring-red-400" : "border-slate-200 focus:ring-blue-500"
                }`}
              />
            )}
            {key === "password" ? (
              <PasswordChecklist password={form.password} />
            ) : (
              errors[key as keyof FieldErrors] && (
                <p className="mt-1 text-xs text-red-500">{errors[key as keyof FieldErrors]}</p>
              )
            )}
          </div>
        ))}

        <Recaptcha ref={recaptchaRef} onChange={setCaptchaToken} />

        <button type="submit" disabled={loading}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition">
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-3 text-center text-xs"><Link href="/role-selection" className="text-blue-600 hover:underline">← Change role</Link></p>
      <p className="mt-3 text-center text-sm text-slate-600">Already have an account? <Link href="/login" className="font-semibold text-blue-600 hover:underline">Sign in</Link></p>
    </div>
  );
}