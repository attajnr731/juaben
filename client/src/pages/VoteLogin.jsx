import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";

const API = "https://juaben.onrender.com/api";

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

const isWithinElectionPeriod = (period) => {
  if (!period) return false;
  const { startDate, startTime, endDate, endTime } = period;
  if (!startDate || !startTime || !endDate || !endTime) return false;
  const now = new Date();
  return (
    now >= new Date(`${startDate}T${startTime}`) &&
    now <= new Date(`${endDate}T${endTime}`)
  );
};

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

  const [periodLoading, setPeriodLoading] = useState(true);
  const [electionPeriod, setElectionPeriod] = useState(null);
  const [votingOpen, setVotingOpen] = useState(false);

  const [voterId, setVoterId] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    const fetchPeriod = async () => {
      try {
        const res = await fetch(`${API}/settings`);
        const data = await res.json();
        const period = data.electionPeriod || null;
        setElectionPeriod(period);
        setVotingOpen(isWithinElectionPeriod(period));
      } catch {
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

  const handleVerify = async (e) => {
    e?.preventDefault();

    if (!voterId.trim()) {
      setError("Please enter your Voter ID.");
      return;
    }
    if (!otp.trim()) {
      setError("Please enter your OTP.");
      return;
    }
    if (otp.trim().length !== 5) {
      setError("OTP must be exactly 5 characters.");
      triggerShake();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/voters/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: voterId.trim(),
          otp: otp.trim().toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Verification failed.");
        triggerShake();
        return;
      }

      navigate("/vote", { state: { voter: data.voter } });
    } catch {
      setError("Server error. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-10px)}
          40%{transform:translateX(10px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
        .shake{animation:shake 0.45s ease}
      `}</style>

      {/* Header */}
      <header className="w-full bg-white border-b border-gray-100 shadow-sm px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-10 w-10 object-contain"
          />
          <div>
            <p className="text-[#0a6b1b] font-black text-sm uppercase tracking-wide leading-tight">
              KETE-KRACHIE <span className="text-[#c8a84b]">NURSING</span>
            </p>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase">
              Student Voting Portal
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* ── Loading ── */}
          {periodLoading ? (
            <div className="bg-white border border-gray-100 shadow-xl px-8 py-16 flex flex-col items-center gap-4">
              <Spinner className="w-6 h-6 text-[#0a6b1b]" />
              <p className="text-gray-400 text-sm">Checking election status…</p>
            </div>
          ) : !votingOpen ? (
            /* ── Voting Closed ── */
            <div
              className={`bg-white border border-gray-100 shadow-xl ${shaking ? "shake" : ""}`}
            >
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
                {electionPeriod?.startDate ? (
                  (() => {
                    const now = new Date();
                    const hasEnded =
                      now >
                      new Date(
                        `${electionPeriod.endDate}T${electionPeriod.endTime}`,
                      );
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
                          className={`text-xs ${hasEnded ? "text-red-600" : "text-amber-600"}`}
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
                    <p className="text-gray-600 font-bold text-sm">
                      No election scheduled
                    </p>
                  </div>
                )}

                {electionPeriod?.startDate && (
                  <div className="bg-gray-50 border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AccessTimeOutlinedIcon
                        style={{ fontSize: 16 }}
                        className="text-[#0a6b1b]"
                      />
                      <p className="text-[#0a6b1b] font-black text-xs uppercase tracking-widest">
                        Voting Window
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-1">
                          Opens
                        </p>
                        <p className="text-gray-700 text-xs font-semibold">
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
                        <p className="text-gray-700 text-xs font-semibold">
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
                  Contact your election administrator if you believe this is an
                  error.
                </p>
              </div>
            </div>
          ) : (
            /* ── Voting Open — Login Form ── */
            <div
              className={`bg-white border border-gray-100 shadow-xl ${shaking ? "shake" : ""}`}
            >
              <div className="bg-[#0a6b1b] px-6 py-6 text-center">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
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
                  Enter your Student ID and OTP to begin voting
                </p>
              </div>

              <div className="px-6 py-8">
                <form onSubmit={handleVerify} className="flex flex-col gap-5">
                  {/* Student ID */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#0a6b1b] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
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
                          : "border-gray-200 focus:border-[#0a6b1b]"
                      }`}
                    />
                  </div>

                  {/* OTP */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#0a6b1b] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <KeyOutlinedIcon style={{ fontSize: 14 }} />
                      One-Time Password (OTP)
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.toUpperCase().slice(0, 5));
                        setError("");
                      }}
                      placeholder="e.g. A3X9K"
                      disabled={loading}
                      maxLength={5}
                      className={`border-2 outline-none px-4 py-3.5 text-sm text-gray-700 placeholder-gray-300 font-mono tracking-[0.3em] transition-colors ${
                        error
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 focus:border-[#0a6b1b]"
                      }`}
                    />
                    <p className="text-gray-400 text-[10px]">
                      Your OTP was provided by the election administrator.
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2 text-red-500 text-xs bg-red-50 border border-red-100 px-3 py-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1" />
                      <p>{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !voterId.trim() || otp.length !== 5}
                    className="w-full bg-[#0a6b1b] hover:bg-[#c8a84b] disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest py-4 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Spinner /> Verifying…
                      </>
                    ) : (
                      "Verify & Continue →"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {!periodLoading && votingOpen && (
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-xs leading-relaxed">
                Your vote is{" "}
                <span className="font-bold text-[#0a6b1b]">anonymous</span> and{" "}
                <span className="font-bold text-[#0a6b1b]">secure</span>. Only
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
