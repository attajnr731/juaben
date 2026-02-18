import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import RadioButtonUncheckedOutlinedIcon from "@mui/icons-material/RadioButtonUncheckedOutlined";
import ArrowDownwardOutlinedIcon from "@mui/icons-material/ArrowDownwardOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";

const API = "https://juaben.onrender.com/api";

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

// ── Avatar fallback ──
const Avatar = ({ src, name, size = "lg" }) => {
  const [err, setErr] = useState(false);
  const initials = name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sizeClass = size === "lg" ? "w-24 h-24 text-2xl" : "w-16 h-16 text-lg";

  if (!src || err) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-[#1a3a6e] text-white font-black flex items-center justify-center shrink-0`}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErr(true)}
      className={`${sizeClass} rounded-full object-cover shrink-0 border-4 border-white shadow-lg`}
    />
  );
};

// ── Spinner ──
const Spinner = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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

const Vote = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const voter = location.state?.voter;

  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selections, setSelections] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Guard: if election closes while user is mid-ballot
  const [votingClosed, setVotingClosed] = useState(false);

  const containerRef = useRef(null);
  const sectionRefs = useRef([]);

  // Redirect if no voter data
  if (!voter) {
    return <Navigate to="/vote-login" replace />;
  }

  // ── Fetch data + validate election period ──
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [settingsRes, candidatesRes] = await Promise.all([
          fetch(`${API}/settings`),
          fetch(`${API}/candidates`),
        ]);

        const [settingsData, candidatesData] = await Promise.all([
          settingsRes.json(),
          candidatesRes.json(),
        ]);

        // ── Period check ──
        if (!isWithinElectionPeriod(settingsData.electionPeriod)) {
          setVotingClosed(true);
          setLoading(false);
          return;
        }

        const pos = settingsData.positions || [];
        setPositions(pos);
        setCandidates(candidatesData);

        const initial = {};
        pos.forEach((_, i) => {
          initial[i] = null;
        });
        setSelections(initial);
      } catch (err) {
        console.error("Failed to fetch voting data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Re-check period every 30 seconds in case it closes mid-session ──
  useEffect(() => {
    if (votingClosed) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/settings`);
        const data = await res.json();
        if (!isWithinElectionPeriod(data.electionPeriod)) {
          setVotingClosed(true);
        }
      } catch (_) {}
    }, 30_000);
    return () => clearInterval(interval);
  }, [votingClosed]);

  // ── IntersectionObserver ──
  useEffect(() => {
    if (loading || positions.length === 0) return;
    const observers = [];
    sectionRefs.current.forEach((section, index) => {
      if (!section) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setCurrentIndex(index);
        },
        { root: containerRef.current, threshold: 0.5 },
      );
      observer.observe(section);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [loading, positions]);

  const candidatesByPosition = positions.map((pos) =>
    candidates.filter((c) => c.position === pos),
  );

  const scrollToPosition = (index) => {
    const section = sectionRefs.current[index];
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNext = () => {
    if (currentIndex < positions.length - 1) scrollToPosition(currentIndex + 1);
  };

  const handleSelect = (posIndex, candidateId) => {
    setSelections((prev) => ({ ...prev, [posIndex]: candidateId }));
  };

  // ── Submit votes ──
  const handleSubmit = async () => {
    // Final period check before submitting
    try {
      const res = await fetch(`${API}/settings`);
      const data = await res.json();
      if (!isWithinElectionPeriod(data.electionPeriod)) {
        setVotingClosed(true);
        setShowConfirm(false);
        return;
      }
    } catch (_) {}

    setSubmitting(true);
    try {
      const votes = Object.entries(selections)
        .filter(([_, candidateId]) => candidateId !== null)
        .map(([posIndex, candidateId]) => ({
          position: positions[posIndex],
          candidateId,
        }));

      await Promise.all(
        votes.map((vote) =>
          fetch(`${API}/candidates/${vote.candidateId}/vote`, {
            method: "PATCH",
          }),
        ),
      );

      await fetch(`${API}/voters/${voter._id}/vote`, { method: "PATCH" });

      navigate("/vote-success", { replace: true });
    } catch (err) {
      console.error("Vote submission failed:", err);
      alert("Failed to submit votes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openConfirm = () => setShowConfirm(true);
  const closeConfirm = () => setShowConfirm(false);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-gray-400 text-sm">Loading ballot…</p>
        </div>
      </div>
    );
  }

  // ── Voting closed / outside period ──
  if (votingClosed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-100 shadow-xl w-full max-w-sm text-center overflow-hidden">
          <div className="bg-gray-700 px-6 py-8">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-9a4 4 0 100 8 4 4 0 000-8z"
                />
              </svg>
            </div>
            <h2
              className="text-white font-black text-xl uppercase tracking-wide"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Voting Closed
            </h2>
          </div>
          <div className="px-6 py-8">
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              The voting window has ended. Your ballot has <strong>not</strong>{" "}
              been submitted. Please contact your election administrator for
              assistance.
            </p>
            <button
              onClick={() => navigate("/vote-login", { replace: true })}
              className="w-full bg-[#1a3a6e] hover:bg-[#c8a84b] text-white font-black text-xs uppercase tracking-widest py-3.5 transition-all duration-300"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── No positions configured ──
  if (positions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[#1a3a6e] font-black text-xl mb-2">
            No Positions Available
          </p>
          <p className="text-gray-400 text-sm">
            The election has not been configured yet.
          </p>
        </div>
      </div>
    );
  }

  const selectedCount = Object.values(selections).filter(
    (v) => v !== null,
  ).length;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      {/* ── Fixed header with progress ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Juaben SHS"
              className="h-8 w-8 object-contain"
            />
            <div className="hidden sm:block">
              <p className="text-[#1a3a6e] font-black text-xs uppercase tracking-wide leading-tight">
                Juaben <span className="text-[#c8a84b]">SHS</span>
              </p>
              <p className="text-gray-400 text-[9px] tracking-widest uppercase">
                Voting Ballot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[#1a3a6e] font-black text-sm">
                {currentIndex + 1}{" "}
                <span className="text-gray-300 font-normal">
                  of {positions.length}
                </span>
              </p>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest">
                Positions
              </p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-gray-100 flex items-center justify-center">
              <span className="text-[#1a3a6e] font-black text-sm">
                {selectedCount}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full h-1 bg-gray-100">
          <div
            className="h-full bg-[#1a3a6e] transition-all duration-500"
            style={{
              width: `${((currentIndex + 1) / positions.length) * 100}%`,
            }}
          />
        </div>
      </header>

      {/* ── Scrollable ballot sections ── */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-auto scroll-smooth snap-y snap-mandatory pt-[73px]"
      >
        {positions.map((position, posIndex) => {
          const cands = candidatesByPosition[posIndex];
          const selected = selections[posIndex];
          const isLast = posIndex === positions.length - 1;

          return (
            <section
              key={posIndex}
              ref={(el) => (sectionRefs.current[posIndex] = el)}
              className="w-full min-h-screen snap-start flex items-center justify-center px-4 py-16"
            >
              <div className="w-full max-w-4xl">
                <div className="text-center mb-10">
                  <p className="text-[#c8a84b] text-xs tracking-[0.3em] uppercase font-bold mb-2">
                    Position {posIndex + 1} of {positions.length}
                  </p>
                  <h2
                    className="text-[#1a3a6e] text-3xl md:text-4xl font-black uppercase mb-3"
                    style={{ fontFamily: "'Georgia', serif" }}
                  >
                    {position}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Select one candidate to represent this position
                  </p>
                </div>

                {cands.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-300 text-sm">
                      No candidates for this position yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {cands.map((c) => {
                      const isSelected = selected === c._id;
                      return (
                        <button
                          key={c._id}
                          onClick={() => handleSelect(posIndex, c._id)}
                          className={`group relative p-6 border-2 transition-all duration-300 hover:shadow-xl ${
                            isSelected
                              ? "border-[#1a3a6e] bg-[#1a3a6e]/5 shadow-lg"
                              : "border-gray-200 bg-white hover:border-[#c8a84b]"
                          }`}
                        >
                          <div className="absolute top-4 right-4">
                            {isSelected ? (
                              <CheckCircleOutlineOutlinedIcon
                                style={{ fontSize: 28 }}
                                className="text-[#1a3a6e]"
                              />
                            ) : (
                              <RadioButtonUncheckedOutlinedIcon
                                style={{ fontSize: 28 }}
                                className="text-gray-200 group-hover:text-gray-300"
                              />
                            )}
                          </div>
                          <div className="flex flex-col items-center text-center gap-4">
                            <Avatar src={c.profilePicture} name={c.name} />
                            <div>
                              <p className="text-[#1a3a6e] font-black text-lg mb-1">
                                {c.name}
                              </p>
                              {c.bio && (
                                <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                                  {c.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-center">
                  {isLast ? (
                    <button
                      onClick={openConfirm}
                      className="flex items-center gap-2 bg-[#1a3a6e] hover:bg-[#c8a84b] text-white font-black text-sm uppercase tracking-widest px-10 py-4 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <SendOutlinedIcon style={{ fontSize: 20 }} />
                      Review & Submit
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 bg-[#1a3a6e] hover:bg-[#c8a84b] text-white font-black text-sm uppercase tracking-widest px-10 py-4 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Next Position
                      <ArrowDownwardOutlinedIcon style={{ fontSize: 20 }} />
                    </button>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── CONFIRMATION MODAL ── */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && closeConfirm()}
        >
          <div className="bg-white w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-[#1a3a6e] px-6 py-5 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <HowToVoteOutlinedIcon
                  style={{ fontSize: 20 }}
                  className="text-[#c8a84b]"
                />
                <span className="text-white font-black text-sm uppercase tracking-widest">
                  Confirm Your Votes
                </span>
              </div>
              <button
                onClick={closeConfirm}
                className="text-white/40 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="bg-gray-50 border border-gray-100 p-4 mb-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1a3a6e] flex items-center justify-center text-white font-black shrink-0">
                  {voter.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-[#1a3a6e] font-black text-sm">
                    {voter.name}
                  </p>
                  <p className="text-gray-400 text-xs font-mono">
                    {voter.studentId}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-[#1a3a6e] font-black text-xs uppercase tracking-widest mb-3">
                  Your Selections
                </p>
                <div className="flex flex-col gap-3">
                  {positions.map((pos, i) => {
                    const candidateId = selections[i];
                    const candidate = candidates.find(
                      (c) => c._id === candidateId,
                    );
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 border border-gray-100 bg-white"
                      >
                        <div>
                          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                            {pos}
                          </p>
                          <p className="text-[#1a3a6e] font-bold text-sm mt-0.5">
                            {candidate ? (
                              candidate.name
                            ) : (
                              <span className="text-gray-300 italic">
                                No selection
                              </span>
                            )}
                          </p>
                        </div>
                        {candidate && (
                          <CheckCircleOutlineOutlinedIcon
                            style={{ fontSize: 20 }}
                            className="text-green-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 px-4 py-3 mb-6">
                <p className="text-amber-800 text-xs font-semibold mb-1">
                  ⚠️ Important
                </p>
                <p className="text-amber-700 text-xs leading-relaxed">
                  Once submitted, your vote <strong>cannot be changed</strong>.
                  Please review your selections carefully before proceeding.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeConfirm}
                  disabled={submitting}
                  className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-500 font-bold text-xs uppercase tracking-widest py-3.5 transition-all disabled:opacity-50"
                >
                  Go Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-[#1a3a6e] hover:bg-[#16a34a] disabled:opacity-60 text-white font-black text-xs uppercase tracking-widest py-3.5 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Spinner /> Submitting…
                    </>
                  ) : (
                    <>
                      <SendOutlinedIcon style={{ fontSize: 16 }} /> Submit Votes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vote;
