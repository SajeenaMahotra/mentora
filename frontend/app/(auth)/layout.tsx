import Logo from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div aria-hidden="true" className="hidden md:flex flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 p-12 text-white">
        <Logo dark />
        <div>
          <blockquote className="text-2xl font-light leading-relaxed text-slate-200 mb-4">
            &ldquo;The beautiful thing about learning is that nobody can take it away from you.&rdquo;
          </blockquote>
          <cite className="text-blue-400 text-sm font-medium">— B.B. King</cite>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[["2,000+","Expert Mentors"],["15,000+","Sessions Done"],["4.9★","Avg Rating"],["50+","Subjects"]].map(([v,l]) => (
            <div key={l} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-400">{v}</div>
              <div className="text-xs text-slate-400 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center p-8 bg-slate-50">{children}</div>
    </div>
  );
}