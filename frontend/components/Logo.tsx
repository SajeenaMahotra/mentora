import Link from "next/link";

interface LogoProps {
  dark?: boolean;
  className?: string;
}

export default function Logo({ dark = false, className = "" }: LogoProps) {
  return (
    <Link href="/" className={`font-display text-2xl font-bold tracking-tight ${className}`}>
      <span className={dark ? "text-white" : "text-slate-900"}>Mentor</span>
      <span className={dark ? "text-[#8CA0FF]" : "text-[#3B5EFF]"}>a</span>
    </Link>
  );
}