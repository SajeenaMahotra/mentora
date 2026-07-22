"use client";
import { useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";

function GoogleSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const userStr = searchParams.get("user");
    if (userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        if (user.isNewUser) {
          login(user, { skipRedirect: true });
          router.replace("/confirm-role");
        } else {
          login(user);
        }
      } catch (err) {
        console.error("Google success page error:", err);
        window.location.href = "/login";
      }
    } else {
      window.location.href = "/login";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">Signing you in...</p>
      </div>
    </div>
  );
}

export default function GoogleSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      </div>
    }>
      <GoogleSuccessContent />
    </Suspense>
  );
}