import Link from "next/link";
import {
  Sigma, Code2, Atom, FlaskConical, BookOpen, Music2, Globe2,
  BarChart3, Palette, ClipboardCheck, BadgeCheck, MessagesSquare,
  GraduationCap, ShieldCheck, Search, UserCheck, CalendarCheck, Rocket,
  Star, ArrowRight, CheckCircle2,
} from "lucide-react";
import Reveal from "@/components/Reveal";

const categories = [
  { name: "Mathematics", Icon: Sigma },
  { name: "Programming", Icon: Code2 },
  { name: "Physics", Icon: Atom },
  { name: "Chemistry", Icon: FlaskConical },
  { name: "English", Icon: BookOpen },
  { name: "Music", Icon: Music2 },
  { name: "Languages", Icon: Globe2 },
  { name: "Business", Icon: BarChart3 },
  { name: "Design", Icon: Palette },
  { name: "Test Prep", Icon: ClipboardCheck },
];

const features = [
  { Icon: BadgeCheck, title: "Verified Mentors", desc: "Every mentor is credential-verified before they can take a booking." },
  { Icon: MessagesSquare, title: "Chat Before You Book", desc: "Message a mentor first, then request the package that actually fits." },
  { Icon: GraduationCap, title: "Real Expertise", desc: "Learn from people with proven, subject-specific experience." },
  { Icon: ShieldCheck, title: "Secure by Design", desc: "Encrypted sessions, protected payments, transparent reviews." },
];

const steps = [
  { n: "01", title: "Choose a Subject", desc: "Browse categories and find the mentor you need.", Icon: Search },
  { n: "02", title: "Pick a Mentor", desc: "Compare verified profiles, ratings, and rates.", Icon: UserCheck },
  { n: "03", title: "Book a Session", desc: "Schedule a time and your preferred format.", Icon: CalendarCheck },
  { n: "04", title: "Start Learning", desc: "Connect one-on-one and start making progress.", Icon: Rocket },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#0B1120] via-[#0F1B3D] to-[#0B1120] text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center px-6 md:px-20 pt-24 pb-28 md:pt-32 md:pb-36">
          <div>
            <span className="inline-block bg-[#3B5EFF]/15 border border-[#3B5EFF]/30 text-[#8CA0FF] text-xs font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full mb-7">
              Nepal&apos;s Mentoring Platform
            </span>
            <h1 className="font-display text-4xl md:text-5xl leading-[1.25] tracking-tight font-semibold mb-7">
              Learn from the <span className="text-[#8CA0FF]">best mentors</span>, on your schedule.
            </h1>
            <p className="text-slate-300 text-lg mb-9 leading-relaxed max-w-md">
              Connect with verified experts for personalized, one-on-one mentoring.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/role-selection"
                className="bg-[#3B5EFF] hover:bg-[#2E4DE0] text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:shadow-[0_8px_24px_rgba(59,94,255,0.4)]"
              >
                Get Started Free
              </Link>
              <Link
                href="/#how-it-works"
                className="border border-white/20 hover:border-white/40 hover:bg-white/5 text-white font-semibold px-7 py-3.5 rounded-xl transition-all"
              >
                See How It Works
              </Link>
            </div>
          </div>

          {/* Signature element: chat leading into a package acceptance, not a scheduled session */}
          <div className="relative hidden md:block">
            <div className="absolute -top-6 -left-6 w-full h-full border border-[#3B5EFF]/20 rounded-3xl" />
            <div className="relative bg-white text-slate-900 rounded-3xl p-6 shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#3B5EFF] to-[#8CA0FF] flex items-center justify-center text-white font-semibold text-sm ring-2 ring-[#C9A876]/40">
                  AR
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-900">Aarav R.</p>
                  <p className="text-xs text-slate-500">Web Development Mentor</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Star className="w-3.5 h-3.5 fill-[#C9A876] text-[#C9A876]" />
                  4.9
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <div className="bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                  <p className="text-sm text-slate-700">
                    Hi! I&apos;m prepping for frontend interviews &mdash; can you help?
                  </p>
                </div>
                <div className="bg-[#3B5EFF]/10 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] ml-auto">
                  <p className="text-sm text-slate-800">
                    Of course &mdash; I have a React Fundamentals package for exactly this.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-500">React Fundamentals</p>
                  <p className="text-sm font-semibold text-slate-900">Rs 3,500 &middot; one-time</p>
                </div>
                <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Accepted
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-20 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[["2,000+", "Expert Mentors"], ["15,000+", "Sessions Done"], ["4.9★", "Avg Rating"], ["50+", "Subjects"]].map(
            ([v, l]) => (
              <div key={l} className="text-center md:text-left">
                <div className="font-display text-3xl font-semibold text-slate-900">{v}</div>
                <div className="text-slate-500 text-sm mt-1">{l}</div>
              </div>
            )
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-16 px-6 md:px-20">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold text-slate-900 mb-2">Browse by Subject</h2>
            <p className="text-slate-500 mb-10">Find a mentor in the subject you need.</p>
          </Reveal>
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {categories.map((c, i) => (
              <Reveal key={c.name} delay={i * 40} className="shrink-0">
                <Link
                  href="/role-selection"
                  className="group flex flex-col items-center min-w-[100px] gap-3 p-5 rounded-2xl border border-slate-100 hover:border-[#3B5EFF]/30 hover:bg-[#3B5EFF]/[0.04] transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-50 group-hover:bg-[#3B5EFF]/10 flex items-center justify-center transition-colors">
                    <c.Icon className="w-5 h-5 text-slate-600 group-hover:text-[#3B5EFF] transition-colors" strokeWidth={1.75} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{c.name}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="about" className="scroll-mt-24 bg-[#FAFAF8] py-24 px-6 md:px-20">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="font-display text-4xl font-semibold text-slate-900 mb-4">Why Choose Mentora?</h2>
            <p className="text-slate-500 max-w-xl mx-auto">We make learning personal, flexible, and genuinely effective.</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-[#3B5EFF]/20 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all h-full">
                  <div className="w-11 h-11 rounded-xl bg-[#3B5EFF]/10 flex items-center justify-center mb-5">
                    <f.Icon className="w-5 h-5 text-[#3B5EFF]" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="scroll-mt-24 bg-white py-24 px-6 md:px-20">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="font-display text-4xl font-semibold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-500">Four steps from &ldquo;I need help&rdquo; to your first session.</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 100} className="relative text-center">
                <div className="w-16 h-16 mx-auto bg-[#3B5EFF] rounded-2xl flex items-center justify-center mb-4">
                  <s.Icon className="w-7 h-7 text-white" strokeWidth={1.75} />
                </div>
                <span className="text-xs font-bold text-[#3B5EFF] tracking-widest">{s.n}</span>
                <h3 className="text-lg font-semibold text-slate-900 mt-1 mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                {i < 3 && (
                  <ArrowRight className="hidden md:block absolute top-7 -right-4 w-5 h-5 text-[#3B5EFF]/30" />
                )}
              </Reveal>
            ))}
          </div>
          <Reveal delay={300} className="text-center mt-14">
            <Link
              href="/role-selection"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#3B5EFF] hover:bg-[#2E4DE0] text-white font-semibold rounded-xl transition-all hover:shadow-[0_8px_24px_rgba(59,94,255,0.35)]"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}