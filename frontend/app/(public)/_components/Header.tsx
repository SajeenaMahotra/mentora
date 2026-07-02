"use client";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navItems: [string, string][] = [
  ["Home", "/"],
  ["About", "/#about"],
  ["How It Works", "/#how-it-works"],
  ["For Mentors", "/for-mentors"],
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-[background-color,box-shadow] duration-200 ease-out ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_0_0_rgba(15,23,42,0.04)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo dark={!scrolled} />

        <nav className="hidden md:flex items-center gap-9">
          {navItems.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className={`relative text-sm font-medium transition-colors after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:transition-all hover:after:w-full ${
                scrolled
                  ? "text-slate-600 hover:text-slate-900 after:bg-[#3B5EFF]"
                  : "text-slate-200 hover:text-white after:bg-[#8CA0FF]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
              scrolled
                ? "text-slate-700 hover:text-[#3B5EFF]"
                : "text-white/90 hover:text-white hover:bg-white/10"
            }`}
          >
            Log in
          </Link>
          <Link
            href="/role-selection"
            className="text-sm font-semibold bg-[#3B5EFF] hover:bg-[#2E4DE0] text-white px-5 py-2.5 rounded-lg transition-all hover:shadow-[0_4px_16px_rgba(59,94,255,0.35)]"
          >
            Sign up
          </Link>
        </div>

        <button
          className={`md:hidden transition-colors ${scrolled ? "text-slate-700" : "text-white"}`}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
          open ? "max-h-80" : "max-h-0"
        }`}
      >
        <div className={`bg-white border-t px-6 py-4 flex flex-col gap-4 transition-colors ${open ? "border-slate-100" : "border-transparent"}`}>
          {navItems.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium text-slate-700"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2">
            <Link
              href="/login"
              className="flex-1 text-center text-sm font-semibold border border-[#3B5EFF] text-[#3B5EFF] py-2 rounded-lg"
              onClick={() => setOpen(false)}
            >
              Log in
            </Link>
            <Link
              href="/role-selection"
              className="flex-1 text-center text-sm font-semibold bg-[#3B5EFF] text-white py-2 rounded-lg"
              onClick={() => setOpen(false)}
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}