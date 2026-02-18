import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";

const VoteSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/vote-login", { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
      <header className="w-full bg-white border-b border-gray-100 shadow-sm px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Juaben SHS" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-[#1a3a6e] font-black text-sm uppercase tracking-wide leading-tight">
                Juaben <span className="text-[#c8a84b]">SHS</span>
              </p>
              <p className="text-gray-400 text-[10px] tracking-widest uppercase">
                Student Elections
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center">
          {/* Success icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-2xl animate-pulse">
              <CheckCircleOutlinedIcon style={{ fontSize: 48 }} className="text-white" />
            </div>
          </div>

          {/* Success message */}
          <h1
            className="text-[#1a3a6e] text-4xl md:text-5xl font-black uppercase mb-4"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Vote Submitted!
          </h1>
          <p className="text-gray-500 text-lg mb-8 leading-relaxed">
            Your vote has been recorded successfully. Thank you for participating in the
            Juaben SHS Student Elections.
          </p>

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: "🔒", label: "Secure", desc: "Encrypted" },
              { icon: "✓", label: "Verified", desc: "Counted" },
              { icon: "🎯", label: "Anonymous", desc: "Private" },
            ].map((card) => (
              <div key={card.label} className="bg-white border border-gray-100 p-4">
                <span className="text-3xl block mb-2">{card.icon}</span>
                <p className="text-[#1a3a6e] font-black text-xs uppercase tracking-widest">{card.label}</p>
                <p className="text-gray-400 text-[10px] uppercase tracking-wider">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* What's next */}
          <div className="bg-blue-50 border-l-4 border-blue-500 px-5 py-4 text-left mb-8">
            <p className="text-blue-800 font-bold text-sm mb-1">📊 What's Next?</p>
            <p className="text-blue-700 text-xs leading-relaxed">
              Results will be announced once the voting period closes. You will be notified via
              your school email and notice boards.
            </p>
          </div>

          {/* Auto-redirect message */}
          <div className="flex items-center justify-center gap-3 text-gray-400 text-sm">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span>Redirecting in 3 seconds…</span>
          </div>

          {/* Footer note */}
          <p className="text-gray-300 text-xs mt-10 leading-relaxed">
            You will be redirected to allow the next voter to proceed.
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-4 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="text-gray-300 text-[10px] uppercase tracking-widest">
            © 2026 Juaben SHS · Student Elections
          </p>
          <p className="text-gray-400 text-xs">
            Powered by <span className="font-bold text-[#1a3a6e]">Juaben Electoral Commission</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default VoteSuccess;