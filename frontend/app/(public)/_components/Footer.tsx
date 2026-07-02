import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="bg-[#0B1120] text-slate-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <div>
            <Logo dark className="mb-4 inline-block" />
            <p className="text-sm leading-relaxed text-slate-400">
              Connecting learners with expert mentors for personalized, one-on-one growth.
            </p>
            <Link
              href="/role-selection"
              className="inline-block mt-4 text-sm font-semibold bg-[#3B5EFF] hover:bg-[#2E4DE0] text-white px-4 py-2 rounded-lg transition-colors"
            >
              Find a Mentor
            </Link>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Platform</h4>
            <div className="flex flex-col gap-2.5 text-sm">
              {[
                ["Home", "/"],
                ["About", "/#about"],
                ["How It Works", "/#how-it-works"],
                ["For Mentors", "/for-mentors"],
              ].map(([l, h]) => (
                <Link key={l} href={h} className="hover:text-white transition-colors w-fit">
                  {l}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Social</h4>
            <div className="flex flex-col gap-2.5 text-sm">
              {["Twitter", "LinkedIn", "Instagram"].map((l) => (
                <a key={l} href="#" className="hover:text-white transition-colors w-fit">
                  {l}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Contact</h4>
            <div className="flex flex-col gap-2.5 text-sm">
              <span>hello@mentora.com</span>
              <span>Kathmandu, Nepal</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 text-xs gap-3">
          <span>© 2026 Mentora. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}