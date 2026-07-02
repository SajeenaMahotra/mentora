"use client";
import ReCAPTCHA from "react-google-recaptcha";
import { forwardRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

interface RecaptchaProps {
  onChange: (token: string | null) => void;
}

const Recaptcha = forwardRef<ReCAPTCHA, RecaptchaProps>(({ onChange }, ref) => {
  if (!SITE_KEY) {
    return (
      <p className="text-xs text-red-500">
        Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY in .env.local
      </p>
    );
  }
  return <ReCAPTCHA ref={ref} sitekey={SITE_KEY} onChange={onChange} />;
});

Recaptcha.displayName = "Recaptcha";
export default Recaptcha;