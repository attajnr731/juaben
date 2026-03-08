import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Welcome = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-2 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="KETE-KRACHIE  Logo"
            className="h-12 w-12 object-contain"
          />
          <div className="hidden sm:block">
            <p className="text-[#0e8c25] font-black text-sm uppercase tracking-wide leading-tight">
              KETE-KRACHIE NURSING & MIDWIFERY
            </p>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase">
              Student Elections
            </p>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
        <img
          src="/hero.jpg"
          alt="KETE-KRACHIE SHS campus"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/60 to-white" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/80 via-transparent to-yellow-50/60" />

        <div
          className={`relative z-10 flex flex-col items-center text-center px-6 transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="flex items-center gap-3 mb-8">
            <span className="h-px w-10 bg-[#c8a84b]" />
            <span className="bg-[#0e8c25] text-white text-[10px] tracking-[0.3em] uppercase font-semibold px-4 py-1.5 rounded-full">
              Official Election Portal · 2026
            </span>
            <span className="h-px w-10 bg-[#c8a84b]" />
          </div>

          <h1
            className="text-[#0e8c25] font-black uppercase leading-none mb-2"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "clamp(2.8rem, 8vw, 6rem)",
              letterSpacing: "-0.02em",
            }}
          >
            KETE-KRACHIE
          </h1>
          <h1
            className="font-black uppercase leading-none mb-6"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "clamp(2.8rem, 8vw, 6rem)",
              letterSpacing: "-0.02em",
              background:
                "linear-gradient(90deg, #b8860b, #c8a84b, #e8c86a, #c8a84b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            NURSING & MIDWIFERY
          </h1>

          <p className="text-gray-500 text-base md:text-lg max-w-lg mb-10 leading-relaxed">
            Your voice. Your school. Your future. Participate in a fair, secure,
            and fully transparent student election.
          </p>
          <Link to="/login">
            <button className="group inline-flex items-center gap-2 bg-[#0e8c25] hover:bg-[#c8a84b] text-white font-bold text-sm tracking-widest uppercase px-10 py-4 transition-all duration-300 shadow-lg hover:shadow-xl">
              <span>Admin Login</span>
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </button>
          </Link>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
          <div className="w-5 h-8 border-2 border-gray-300 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-gray-400 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#c8a84b] text-xs tracking-[0.3em] uppercase mb-3 font-semibold">
              Why Participate
            </p>
            <h2
              className="text-[#0e8c25] text-3xl md:text-4xl font-black uppercase"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Democracy Starts Here
            </h2>
            <p className="text-gray-400 mt-4 max-w-md mx-auto text-sm">
              Every vote counts. Be part of the change you want to see in
              KETE-KRACHIE NURSING & MIDWIFERY.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🗳️",
                title: "Secure Voting",
                desc: "Your identity and ballot are fully protected. One student, one verified vote — no tampering, ever.",
              },
              {
                icon: "⚡",
                title: "Instant Results",
                desc: "Live tallies published the moment polls close. Full transparency, no waiting, no bias.",
              },
              {
                icon: "🏆",
                title: "Your Leaders",
                desc: "Choose student executives who will represent and champion your needs for the coming year.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white border border-gray-100 hover:border-[#c8a84b] hover:shadow-xl transition-all duration-300 p-10 group"
              >
                <span className="text-4xl mb-5 block">{card.icon}</span>
                <h3 className="text-[#0e8c25] font-black text-lg uppercase tracking-wide mb-3 group-hover:text-[#c8a84b] transition-colors">
                  {card.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW TO VOTE ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#c8a84b] text-xs tracking-[0.3em] uppercase mb-3 font-semibold">
            Simple Process
          </p>
          <h2
            className="text-[#0e8c25] text-3xl md:text-4xl font-black uppercase mb-16"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            How to Vote
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                title: "Login",
                desc: "Sign in with your student ID and credentials.",
              },
              {
                step: "02",
                title: "Choose",
                desc: "Review candidates and select your preferred choice.",
              },
              {
                step: "03",
                title: "Submit",
                desc: "Confirm and cast your ballot. Done in under 2 minutes!",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center gap-3">
                <span
                  className="text-5xl font-black text-gray-100"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {item.step}
                </span>
                <div className="w-12 h-px bg-[#c8a84b]" />
                <h4 className="text-[#0e8c25] font-black uppercase tracking-widest text-sm">
                  {item.title}
                </h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-50 border-t border-gray-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="logo"
              className="h-8 w-8 object-contain opacity-60"
            />
            <span className="text-gray-400 text-xs tracking-widest uppercase">
              KETE-KRACHIE NURSING & MIDWIFERY
            </span>
          </div>
          <p className="text-gray-300 text-xs">
            © 2026 · Student Elections Portal · All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
