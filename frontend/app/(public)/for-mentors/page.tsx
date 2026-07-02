import Link from "next/link";
import { Wallet, MessagesSquare, Star, ShieldCheck, ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";

const benefits = [
  {
    Icon: Wallet,
    title: "Set your own package price",
    desc: "Price your packages however you see fit — no fixed platform pricing, you're in control of what you charge.",
  },
  {
    Icon: MessagesSquare,
    title: "Chat before you commit",
    desc: "Learners message you before requesting a package, so you know what they need before you accept.",
  },
  {
    Icon: Star,
    title: "Build a real reputation",
    desc: "Every completed session can earn a review. Your rating and history follow you and help you get booked more.",
  },
  {
    Icon: ShieldCheck,
    title: "Get paid securely",
    desc: "Payments run through a secure checkout, so you don't have to chase learners for money after a session.",
  },
];

export default function ForMentorsPage() {
  return (
    <>
      <section className="relative bg-gradient-to-b from-[#0B1120] via-[#0F1B3D] to-[#0B1120] text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
          <span className="inline-block bg-[#3B5EFF]/15 border border-[#3B5EFF]/30 text-[#8CA0FF] text-xs font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full mb-7">
            For Mentors
          </span>
          <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[1.08] mb-6">
            Share what you know.
            <br />
            <span className="text-[#8CA0FF] italic">Earn on your terms.</span>
          </h1>
          <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Set your own rates, manage your own availability, and get matched with learners
            who are actually looking for what you teach.
          </p>
          <Link
            href="/register?role=mentor"
            className="inline-flex items-center gap-2 bg-[#3B5EFF] hover:bg-[#2E4DE0] text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all hover:shadow-[0_8px_24px_rgba(59,94,255,0.4)]"
          >
            Become a Mentor
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="bg-[#FAFAF8] py-24 px-6 md:px-20">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-slate-900 mb-4">
              Everything you need to mentor, nothing you don&apos;t
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              A straightforward toolkit for turning your expertise into sessions people actually book.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {benefits.map((b, i) => (
              <Reveal key={b.title} delay={i * 80}>
                <div className="bg-white rounded-2xl p-7 border border-slate-100 hover:border-[#3B5EFF]/20 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all h-full">
                  <div className="w-11 h-11 rounded-xl bg-[#3B5EFF]/10 flex items-center justify-center mb-5">
                    <b.Icon className="w-5 h-5 text-[#3B5EFF]" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2 text-lg">{b.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 px-6 md:px-20">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold text-slate-900 mb-4">
              Getting started takes minutes
            </h2>
            <p className="text-slate-500 mb-10 leading-relaxed">
              Create your mentor profile, add the subjects you teach and your rates, and you&apos;re
              ready to start receiving bookings from learners on the platform.
            </p>
            <Link
              href="/register?role=mentor"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#3B5EFF] hover:bg-[#2E4DE0] text-white font-semibold rounded-xl transition-all hover:shadow-[0_8px_24px_rgba(59,94,255,0.35)]"
            >
              Create Your Mentor Profile
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}