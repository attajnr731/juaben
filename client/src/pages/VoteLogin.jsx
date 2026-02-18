import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";

const API = "http://localhost:3000/api";

const VoteLogin = () => {
  const navigate = useNavigate();
  const [voterId, setVoterId] = useState("");
  const [voter, setVoter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  // ── Verify voter ID ──
  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!voterId.trim()) {
      setError("Please enter your Voter ID.");
      return;
    }

    setLoading(true);
    setError("");
    setVoter(null);

    try {
      const res = await fetch(`${API}/voters?search=${encodeURIComponent(voterId.trim())}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to verify ID.");

      // Find exact match
      const match = data.find((v) => v.studentId.toLowerCase() === voterId.trim().toLowerCase());

      if (!match) {
        setError("Voter ID not found. Please check and try again.");
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        return;
      }

      // Check if already voted
      if (match.hasVoted) {
        setError("You have already cast your vote. Thank you for participating!");
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        return;
      }

      // Valid voter found
      setVoter(match);
    } catch (err) {
      setError(err.message || "Server error. Please try again.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setLoading(false);
    }
  };

  // ── Proceed to voting ──
  const handleProceed = () => {
    if (!voter) return;
    // Pass voter data to the vote page via state
    navigate("/vote", { state: { voter } });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-10px); }
          40%       { transform: translateX(10px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
        .shake { animation: shake 0.45s ease; }
      `}</style>

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
                Student Voting Portal
              </p>
            </div>
          </div>
      
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className={`bg-white border border-gray-100 shadow-xl ${shaking ? "shake" : ""}`}>
            {/* Header */}
            <div className="bg-[#1a3a6e] px-6 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                <HowToVoteOutlinedIcon style={{ fontSize: 28 }} className="text-white" />
              </div>
              <h1 className="text-white font-black text-xl uppercase tracking-wide mb-1"
                style={{ fontFamily: "'Georgia', serif" }}>
                Voter Verification
              </h1>
              <p className="text-white/70 text-xs">Enter your Student ID to begin voting</p>
            </div>

            {/* Body */}
            <div className="px-6 py-8">
              {!voter ? (
                // ── Step 1: Enter ID ──
                <form onSubmit={handleVerify} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[#1a3a6e] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <PersonOutlineOutlinedIcon style={{ fontSize: 14 }} />
                      Student / Voter ID
                    </label>
                    <input
                      type="text"
                      value={voterId}
                      onChange={(e) => {
                        setVoterId(e.target.value);
                        setError("");
                      }}
                      placeholder="e.g. JHS001"
                      autoFocus
                      disabled={loading}
                      className={`border-2 outline-none px-4 py-3.5 text-sm text-gray-700 placeholder-gray-300 font-mono transition-colors ${
                        error
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 focus:border-[#1a3a6e]"
                      }`}
                    />
                    {error && (
                      <div className="flex items-start gap-2 text-red-500 text-xs bg-red-50 border border-red-100 px-3 py-2.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1" />
                        <p>{error}</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !voterId.trim()}
                    className="w-full bg-[#1a3a6e] hover:bg-[#c8a84b] disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest py-4 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Verifying…
                      </>
                    ) : (
                      "Verify ID →"
                    )}
                  </button>
                </form>
              ) : (
                // ── Step 2: Confirmation ──
                <div className="flex flex-col gap-6">
                  {/* Success banner */}
                  <div className="bg-green-50 border-l-4 border-green-500 px-4 py-4 flex items-center gap-3">
                    <CheckCircleOutlineOutlinedIcon style={{ fontSize: 22 }} className="text-green-600 shrink-0" />
                    <div>
                      <p className="text-green-700 font-bold text-sm">Voter ID Verified</p>
                      <p className="text-green-600 text-xs mt-0.5">Please confirm your details below</p>
                    </div>
                  </div>

                  {/* Voter info card */}
                  <div className="border-2 border-gray-100 p-5 bg-gray-50">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-[#1a3a6e] flex items-center justify-center text-white text-lg font-black shrink-0">
                        {voter.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1a3a6e] font-black text-lg truncate">{voter.name}</p>
                        <p className="text-gray-400 text-xs font-mono">{voter.studentId}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-3 text-center">
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-1">Status</p>
                        <p className="text-green-600 text-xs font-bold">Eligible to Vote</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-1">Ballot</p>
                        <p className="text-[#1a3a6e] text-xs font-bold">Not Cast</p>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation message */}
                  <div className="text-center">
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Is this you? If the information above is correct, click "Proceed to Vote" to continue.
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setVoter(null);
                        setVoterId("");
                        setError("");
                      }}
                      className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 font-bold text-xs uppercase tracking-widest py-3.5 transition-all"
                    >
                      Not Me
                    </button>
                    <button
                      onClick={handleProceed}
                      className="flex-1 bg-[#1a3a6e] hover:bg-[#c8a84b] text-white font-black text-xs uppercase tracking-widest py-3.5 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      Proceed to Vote
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-xs leading-relaxed">
              Your vote is <span className="font-bold text-[#1a3a6e]">anonymous</span> and{" "}
              <span className="font-bold text-[#1a3a6e]">secure</span>. Only one vote per student is allowed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteLogin;