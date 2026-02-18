import { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import ArrowDownwardOutlinedIcon from "@mui/icons-material/ArrowDownwardOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import { Link } from "react-router-dom";

const API = "https://juaben.onrender.com/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

// ── Avatar fallback ──
const Avatar = ({ src, name, size = "md" }) => {
  const [err, setErr] = useState(false);
  const initials = name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sizeClass =
    size === "lg"
      ? "w-20 h-20 text-xl"
      : size === "md"
        ? "w-12 h-12 text-sm"
        : "w-10 h-10 text-xs";

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
      className={`${sizeClass} rounded-full object-cover shrink-0 border-2 border-gray-100`}
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

// ── Custom Recharts Tooltip ──
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-[#1a3a6e] shadow-xl px-4 py-3">
        <p className="text-[#1a3a6e] font-black text-sm">
          {payload[0].payload.name}
        </p>
        <p className="text-gray-600 text-xs mt-1">
          <span className="font-bold">{payload[0].value}</span> votes
        </p>
      </div>
    );
  }
  return null;
};

const Results = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [voters, setVoters] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const containerRef = useRef(null);
  // Holds a ref for each position section so the observer and scrollToPosition can use it
  const sectionRefs = useRef([]);

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, candidatesRes, votersRes] = await Promise.all([
        fetch(`${API}/settings`, { headers: authHeaders() }),
        fetch(`${API}/candidates`, { headers: authHeaders() }),
        fetch(`${API}/voters`, { headers: authHeaders() }),
      ]);

      const [settingsData, candidatesData, votersData] = await Promise.all([
        settingsRes.json(),
        candidatesRes.json(),
        votersRes.json(),
      ]);

      setPositions(settingsData.positions || []);
      setCandidates(candidatesData);
      setVoters(votersData);
    } catch (err) {
      console.error("Failed to fetch results:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchData();
    setTimeout(() => setRefreshing(false), 500);
  };

  // ── IntersectionObserver: keep currentIndex in sync with whatever section
  //    is scrolled into view — fixes "Next only works once" bug ──
  useEffect(() => {
    if (loading || positions.length === 0) return;

    const observers = [];

    sectionRefs.current.forEach((section, index) => {
      if (!section) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setCurrentIndex(index);
          }
        },
        {
          root: containerRef.current,
          // Fire when the section covers at least 50% of the scroll container
          threshold: 0.5,
        },
      );
      observer.observe(section);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [loading, positions]);

  // Group candidates by position
  const resultsByPosition = positions.map((pos) => {
    const cands = candidates
      .filter((c) => c.position === pos)
      .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

    const totalVotes = cands.reduce((s, c) => s + (c.voteCount || 0), 0);
    const winner = cands[0];

    return { position: pos, candidates: cands, totalVotes, winner };
  });

  // Overall stats
  const totalVotes = candidates.reduce((s, c) => s + (c.voteCount || 0), 0);
  const votedCount = voters.filter((v) => v.hasVoted).length;
  const turnout =
    voters.length > 0 ? Math.round((votedCount / voters.length) * 100) : 0;

  // ── Navigate to position ──
  const scrollToPosition = (index) => {
    const section = sectionRefs.current[index];
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      // currentIndex will be updated by the IntersectionObserver
    }
  };

  const handleNext = () => {
    if (currentIndex < positions.length - 1) {
      scrollToPosition(currentIndex + 1);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-gray-400 text-sm">Loading results…</p>
        </div>
      </div>
    );
  }

  // ── No positions ──
  if (positions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 md:px-8 py-8">
        <div className="max-w-5xl mx-auto text-center py-16">
          <p className="text-[#1a3a6e] font-black text-xl mb-2">
            No Results Available
          </p>
          <p className="text-gray-400 text-sm">
            The election has not been configured yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      {/* ── Fixed header ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Juaben SHS"
              className="h-8 w-8 object-contain"
            />
            <div>
              <Link to="/admin/insights">
                <p className="text-[#1a3a6e] font-black text-sm uppercase tracking-wide leading-tight">
                  <span className="text-[#c8a84b]">Election</span> Results
                </p>
                <p className="text-gray-400 text-[9px] tracking-widest uppercase">
                  Juaben SHS 2026
                </p>
              </Link>
            </div>
          </div>

          {/* Stats & refresh */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <HowToVoteOutlinedIcon
                  style={{ fontSize: 16 }}
                  className="text-gray-400"
                />
                <span className="text-gray-600">
                  <span className="font-black text-[#1a3a6e]">
                    {totalVotes}
                  </span>{" "}
                  votes
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <PeopleOutlineOutlinedIcon
                  style={{ fontSize: 16 }}
                  className="text-gray-400"
                />
                <span className="text-gray-600">
                  <span className="font-black text-[#1a3a6e]">{turnout}%</span>{" "}
                  turnout
                </span>
              </div>
            </div>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="p-2 rounded hover:bg-gray-100 text-gray-400 hover:text-[#1a3a6e] transition-colors disabled:opacity-50"
            >
              <RefreshOutlinedIcon
                style={{ fontSize: 20 }}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-100">
          <div
            className="h-full bg-[#1a3a6e] transition-all duration-500"
            style={{
              width: `${((currentIndex + 1) / positions.length) * 100}%`,
            }}
          />
        </div>
      </header>

      {/* ── Scrollable result sections ── */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-auto scroll-smooth snap-y snap-mandatory pt-[61px]"
      >
        {resultsByPosition.map((result, posIndex) => {
          const isLast = posIndex === positions.length - 1;
          const hasVotes = result.totalVotes > 0;

          // Prepare chart data
          const chartData = result.candidates.map((c) => ({
            name: c.name.split(" ")[0], // First name only for chart
            votes: c.voteCount || 0,
            fullName: c.name,
          }));

          return (
            <section
              key={posIndex}
              // Attach each section to sectionRefs so the observer and scrollToPosition can use it
              ref={(el) => (sectionRefs.current[posIndex] = el)}
              className="w-full min-h-screen snap-start flex items-center justify-center px-4 py-16"
            >
              <div className="w-full max-w-7xl">
                {/* Position header */}
                <div className="text-center mb-10 mt-5">
                  <h2
                    className="text-[#1a3a6e] text-4xl md:text-5xl font-black uppercase mb-3"
                    style={{ fontFamily: "'Georgia', serif" }}
                  >
                    {result.position}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {result.totalVotes} vote{result.totalVotes !== 1 ? "s" : ""}{" "}
                    cast
                  </p>
                </div>

                {!hasVotes ? (
                  // No votes yet
                  <div className="text-center py-16">
                    <p className="text-gray-300 text-sm">
                      No votes cast for this position yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* Left: Winner card */}
                    <div className="bg-white border-2 border-[#c8a84b] shadow-xl p-8 flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#FFD700] flex items-center justify-center shadow-lg">
                        <EmojiEventsOutlinedIcon
                          style={{ fontSize: 32 }}
                          className="text-white"
                        />
                      </div>
                      <div>
                        <p className="text-[#c8a84b] text-xs tracking-widest uppercase font-bold mb-2">
                          Winner
                        </p>
                        <Avatar
                          src={result.winner?.profilePicture}
                          name={result.winner?.name}
                          size="lg"
                        />
                        <p className="text-[#1a3a6e] font-black text-2xl mt-4 mb-1">
                          {result.winner?.name}
                        </p>
                        <p className="text-gray-400 text-xs mb-4">
                          {result.position}
                        </p>
                        <div className="flex items-center justify-center gap-2 bg-[#1a3a6e] text-white px-6 py-2">
                          <HowToVoteOutlinedIcon style={{ fontSize: 18 }} />
                          <span className="font-black text-lg">
                            {result.winner?.voteCount || 0}
                          </span>
                          <span className="text-xs uppercase tracking-widest">
                            Votes
                          </span>
                        </div>
                        {result.totalVotes > 0 && (
                          <p className="text-gray-400 text-xs mt-3">
                            {Math.round(
                              ((result.winner?.voteCount || 0) /
                                result.totalVotes) *
                                100,
                            )}
                            % of total votes
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Chart */}
                    <div className="bg-white border border-gray-100 shadow-sm p-6 flex flex-col">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                        <WorkOutlineOutlinedIcon
                          style={{ fontSize: 18 }}
                          className="text-[#1a3a6e]"
                        />
                        <p className="text-[#1a3a6e] font-black text-sm uppercase tracking-wide">
                          Vote Distribution
                        </p>
                      </div>
                      <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis
                              dataKey="name"
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              tick={{ fontSize: 11, fill: "#6b7280" }}
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                              {chartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={index === 0 ? "#c8a84b" : "#1a3a6e"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full candidate list */}
                {hasVotes && (
                  <div className="bg-white border border-gray-100 shadow-sm overflow-hidden mb-10">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                      <p className="text-[#1a3a6e] font-black text-sm uppercase tracking-wide">
                        All Candidates
                      </p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {result.candidates.map((c, i) => {
                        const percentage =
                          result.totalVotes > 0
                            ? Math.round(
                                ((c.voteCount || 0) / result.totalVotes) * 100,
                              )
                            : 0;
                        return (
                          <div
                            key={c._id}
                            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <span
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm ${
                                  i === 0
                                    ? "bg-[#FFD700] text-white"
                                    : i === 1
                                      ? "bg-[#C0C0C0] text-white"
                                      : i === 2
                                        ? "bg-[#CD7F32] text-white"
                                        : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {i + 1}
                              </span>
                              <Avatar
                                src={c.profilePicture}
                                name={c.name}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-700 font-bold text-sm truncate">
                                  {c.name}
                                </p>
                                {c.bio && (
                                  <p className="text-gray-400 text-xs truncate">
                                    {c.bio}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-6 shrink-0">
                              <div className="text-right">
                                <p className="text-[#1a3a6e] font-black text-xl">
                                  {c.voteCount || 0}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {percentage}%
                                </p>
                              </div>
                              <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#1a3a6e] rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Navigation button */}
                <div className="flex justify-center">
                  {!isLast ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 bg-[#1a3a6e] hover:bg-[#c8a84b] text-white font-black text-sm uppercase tracking-widest px-10 py-4 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Next Position
                      <ArrowDownwardOutlinedIcon style={{ fontSize: 20 }} />
                    </button>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-2">
                        End of Results
                      </p>
                      <p className="text-[#1a3a6e] font-black text-xs uppercase tracking-widest">
                        {positions.length} Position
                        {positions.length !== 1 ? "s" : ""} · {totalVotes} Total
                        Votes
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default Results;
