import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const API = "https://juaben.onrender.com/api";

// ── Spinner ──
const Spinner = ({ className = "w-4 h-4" }) => (
  <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

// ── Check if current time is within the election period ──
const isWithinElectionPeriod = (period) => {
  if (!period) return false;
  const { startDate, startTime, endDate, endTime } = period;
  if (!startDate || !startTime || !endDate || !endTime) return false;

  const now = new Date();
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);

  return now >= start && now <= end;
};

// ── Format date nicely ──
const formatDateTime = (date, time) => {
  if (!date || !time) return "—";
  return new Date(`${date}T${time}`).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const VoteLogin = () => {
  const navigate = useNavigate();

  // ── Election period state ──
  const [periodLoading, setPeriodLoading] = useState(true);
  const [electionPeriod, setElectionPeriod] = useState(null);
  const [votingOpen, setVotingOpen] = useState(false);

  // ── Voter login state ──
  const [voterId, setVoterId] = useState("");
  const [voter, setVoter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  // ── Fetch election period on mount ──
  useEffect(() => {
    const fetchPeriod = async () => {
      try {
        const res = await fetch(`${API}/settings`);
        const data = await res.json();
        const period = data.electionPeriod || null;
        setElectionPeriod(period);
        setVotingOpen(isWithinElectionPeriod(period));
      } catch (err) {
        console.error("Failed to fetch election period:", err);
        setVotingOpen(false);
      } finally {
        setPeriodLoading(false);
      }
    };
    fetchPeriod();
  }, []);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

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
      const res = await fetch(
        `${API}/voters?search=${encodeURIComponent(voterId.trim())}`,
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to verify ID.");

      const match = data.find(
        (v) => v.studentId.toLowerCase() === voterId.trim().toLowerCase(),
      );

      if (!match) {
        setError("Voter ID not found. Please check and try again.");
        triggerShake();
        return;
      }

      if (match.hasVoted) {
        setError(
          "You have already cast your vote. Thank you for participating!",
        );
        triggerShake();
        return;
      }

      setVoter(match);
    } catch (err) {
      setError(err.message || "Server error. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ── Proceed to voting ──
  const handleProceed = () => {
    if (!voter) return;
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
            <img
              src="/logo.png"
              alt="Juaben SHS"
              className="h-10 w-10 object-contain"
            />
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
          {/* ════════════════════════════════
              LOADING PERIOD CHECK
          ════════════════════════════════ */}
          {periodLoading ? (
            <div className="bg-white border border-gray-100 shadow-xl px-8 py-16 flex flex-col items-center gap-4">
              <Spinner className="w-6 h-6 text-[#1a3a6e]" />
              <p className="text-gray-400 text-sm">Checking election status…</p>
            </div>
          ) : !votingOpen ? (
            /* ════════════════════════════════
                VOTING CLOSED STATE
            ════════════════════════════════ */
            <div
              className={`bg-white border border-gray-100 shadow-xl ${shaking ? "shake" : ""}`}
            >
              {/* Header */}
              <div className="bg-gray-700 px-6 py-6 text-center">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <LockOutlinedIcon
                    style={{ fontSize: 28 }}
                    className="text-white"
                  />
                </div>
                <h1
                  className="text-white font-black text-xl uppercase tracking-wide mb-1"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  Voting Closed
                </h1>
                <p className="text-white/70 text-xs">
                  The election portal is not currently open
                </p>
              </div>

              <div className="px-6 py-8 flex flex-col gap-5">
                {/* Status message */}
                {electionPeriod?.startDate ? (
                  (() => {
                    const now = new Date();
                    const start = new Date(
                      `${electionPeriod.startDate}T${electionPeriod.startTime}`,
                    );
                    const end = new Date(
                      `${electionPeriod.endDate}T${electionPeriod.endTime}`,
                    );
                    const hasEnded = now > end;

                    return (
                      <div
                        className={`border-l-4 px-4 py-4 ${hasEnded ? "bg-red-50 border-red-400" : "bg-amber-50 border-amber-400"}`}
                      >
                        <p
                          className={`font-bold text-sm mb-1 ${hasEnded ? "text-red-700" : "text-amber-700"}`}
                        >
                          {hasEnded
                            ? "Election has ended"
                            : "Election hasn't started yet"}
                        </p>
                        <p
                          className={`text-xs leading-relaxed ${hasEnded ? "text-red-600" : "text-amber-600"}`}
                        >
                          {hasEnded
                            ? "Voting has closed. Results are being tallied."
                            : "Please return during the voting window below."}
                        </p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="bg-gray-50 border-l-4 border-gray-300 px-4 py-4">
                    <p className="text-gray-600 font-bold text-sm mb-1">
                      No election scheduled
                    </p>
                    <p className="text-gray-500 text-xs">
                      The election period has not been configured yet.
                    </p>
                  </div>
                )}

                {/* Period info */}
                {electionPeriod?.startDate && (
                  <div className="bg-gray-50 border border-gray-100 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AccessTimeOutlinedIcon
                        style={{ fontSize: 16 }}
                        className="text-[#1a3a6e]"
                      />
                      <p className="text-[#1a3a6e] font-black text-xs uppercase tracking-widest">
                        Voting Window
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-1">
                          Opens
                        </p>
                        <p className="text-gray-700 text-xs font-semibold leading-relaxed">
                          {formatDateTime(
                            electionPeriod.startDate,
                            electionPeriod.startTime,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-1">
                          Closes
                        </p>
                        <p className="text-gray-700 text-xs font-semibold leading-relaxed">
                          {formatDateTime(
                            electionPeriod.endDate,
                            electionPeriod.endTime,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-center text-gray-400 text-xs">
                  Please contact your election administrator if you believe this
                  is an error.
                </p>
              </div>
            </div>
          ) : (
            /* ════════════════════════════════
                VOTING OPEN — LOGIN FORM
            ════════════════════════════════ */
            <div
              className={`bg-white border border-gray-100 shadow-xl ${shaking ? "shake" : ""}`}
            >
              {/* Header */}
              <div className="bg-[#1a3a6e] px-6 py-6 text-center">
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                  <HowToVoteOutlinedIcon
                    style={{ fontSize: 28 }}
                    className="text-white"
                  />
                </div>
                <h1
                  className="text-white font-black text-xl uppercase tracking-wide mb-1"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  Voter Verification
                </h1>
                <p className="text-white/70 text-xs">
                  Enter your Student ID to begin voting
                </p>
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
                          <Spinner />
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
                      <CheckCircleOutlineOutlinedIcon
                        style={{ fontSize: 22 }}
                        className="text-green-600 shrink-0"
                      />
                      <div>
                        <p className="text-green-700 font-bold text-sm">
                          Voter ID Verified
                        </p>
                        <p className="text-green-600 text-xs mt-0.5">
                          Please confirm your details below
                        </p>
                      </div>
                    </div>

                    {/* Voter info card */}
                    <div className="border-2 border-gray-100 p-5 bg-gray-50">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-[#1a3a6e] flex items-center justify-center text-white text-lg font-black shrink-0">
                          {voter.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#1a3a6e] font-black text-lg truncate">
                            {voter.name}
                          </p>
                          <p className="text-gray-400 text-xs font-mono">
                            {voter.studentId}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-3 text-center">
                        <div>
                          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-1">
                            Status
                          </p>
                          <p className="text-green-600 text-xs font-bold">
                            Eligible to Vote
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-1">
                            Ballot
                          </p>
                          <p className="text-[#1a3a6e] text-xs font-bold">
                            Not Cast
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Confirmation message */}
                    <div className="text-center">
                      <p className="text-gray-500 text-sm leading-relaxed">
                        Is this you? If the information above is correct, click
                        "Proceed to Vote" to continue.
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
                        <svg
                          className="w-4 h-4"
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info footer — only show when voting is open */}
          {!periodLoading && votingOpen && (
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-xs leading-relaxed">
                Your vote is{" "}
                <span className="font-bold text-[#1a3a6e]">anonymous</span> and{" "}
                <span className="font-bold text-[#1a3a6e]">secure</span>. Only
                one vote per student is allowed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoteLogin;
