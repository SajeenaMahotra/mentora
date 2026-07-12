"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/authContext";

export default function GoogleSuccessPage() {
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");
    if (token && userStr) {
      try { login(token, JSON.parse(decodeURIComponent(userStr))); }
      catch { window.location.href = "/login"; }
    } else {
      window.location.href = "/login";
    }
  }, [searchParams, login]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">Signing you in...</p>
      </div>
    </div>
  );
}
