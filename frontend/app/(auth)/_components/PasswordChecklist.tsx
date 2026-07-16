"use client";
import { Check, X } from "lucide-react";

interface PasswordChecklistProps {
  password: string;
}

const rules = [
  { label: "At least 12 characters", test: (p: string) => p.length >= 12 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export default function PasswordChecklist({ password }: PasswordChecklistProps) {
  return (
    <ul className="mt-2 space-y-1">
      {rules.map((rule) => {
        const passed = rule.test(password);
        return (
          <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${passed ? "text-green-600" : "text-slate-600"}`}>
            {passed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}