import { useState, useEffect, useCallback } from "react";
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
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import * as XLSX from "xlsx";

const API = "https://juaben.onrender.com/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

// ── Export comprehensive 3-sheet Excel report ──
const exportResults = ({ positions, candidates, voters }) => {
  const wb = XLSX.utils.book_new();
  const date = new Date().toISOString().slice(0, 10);

  // ── Sheet 1: Summary ──
  const votedCount = voters.filter((v) => v.hasVoted).length;
  const totalVotes = candidates.reduce((s, c) => s + (c.voteCount || 0), 0);
  const turnout =
    voters.length > 0 ? ((votedCount / voters.length) * 100).toFixed(1) : "0.0";

  const summaryRows = [
    { Metric: "Election Date", Value: date },
    { Metric: "Total Positions", Value: positions.length },
    { Metric: "Total Candidates", Value: candidates.length },
    { Metric: "Total Registered Voters", Value: voters.length },
    { Metric: "Voters Who Voted", Value: votedCount },
    { Metric: "Pending Voters", Value: voters.length - votedCount },
    { Metric: "Voter Turnout", Value: `${turnout}%` },
    { Metric: "Total Votes Cast", Value: totalVotes },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 30 }, { wch: 44 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // ── Sheet 2: Results by Position ──
  const resultRows = [];
  let rowNum = 1;

  positions.forEach((pos) => {
    const cands = candidates
      .filter((c) => c.position === pos)
      .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

    cands.forEach((c, i) => {
      const pctOfVoters =
        votedCount > 0
          ? (((c.voteCount || 0) / votedCount) * 100).toFixed(1)
          : "0.0";

      resultRows.push({
        "#": rowNum++,
        Name: c.name,
        Position: pos,
        Rank: i + 1,
        Votes: c.voteCount || 0,
        "% of Votes": `${pctOfVoters}%`,
      });
    });
  });

  const wsResults = XLSX.utils.json_to_sheet(resultRows);
  wsResults["!cols"] = [
    { wch: 5 },
    { wch: 28 },
    { wch: 24 },
    { wch: 6 },
    { wch: 8 },
    { wch: 14 },
    { wch: 14 },
    { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, wsResults, "Results by Position");

  // ── Sheet 3: Voters ──
  const voterRows = voters.map((v, i) => ({
    "#": i + 1,
    "Student ID": v.studentId,
    Name: v.name,
    "Has Voted": v.hasVoted ? "Yes" : "No",
  }));

  const wsVoters = XLSX.utils.json_to_sheet(voterRows);
  wsVoters["!cols"] = [{ wch: 5 }, { wch: 16 }, { wch: 28 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsVoters, "Voters");

  XLSX.writeFile(wb, `election_results_${date}.xlsx`);
};

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
  const [selectedPosition, setSelectedPosition] = useState("");

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

      const pos = settingsData.positions || [];
      setPositions(pos);
      setCandidates(candidatesData);
      setVoters(votersData);

      // Auto-select first position
      if (pos.length > 0 && !selectedPosition) {
        setSelectedPosition(pos[0]);
      }
    } catch (err) {
      console.error("Failed to fetch results:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPosition]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const totalVotes = candidates.reduce((s, c) => s + (c.voteCount || 0), 0);
  const votedCount = voters.filter((v) => v.hasVoted).length;
  const turnout =
    voters.length > 0 ? Math.round((votedCount / voters.length) * 100) : 0;

  // Get selected position data
  const selectedCandidates = candidates
    .filter((c) => c.position === selectedPosition)
    .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

  const selectedTotalVotes = selectedCandidates.reduce(
    (s, c) => s + (c.voteCount || 0),
    0,
  );
  const selectedWinner = selectedCandidates[0];
  // After: const selectedWinner = selectedCandidates[0];
  const topVoteCount = selectedWinner?.voteCount || 0;
  const isTie =
    selectedCandidates.filter(
      (c) => c.voteCount === topVoteCount && topVoteCount > 0,
    ).length > 1;
  const tiedCandidates = isTie
    ? selectedCandidates.filter((c) => c.voteCount === topVoteCount)
    : [];
  // Add this after selectedWinner
  const totalForPosition = Math.max(selectedTotalVotes, votedCount);
  const skippedVotes = Math.max(0, totalForPosition - selectedTotalVotes);
  const hasVotes = selectedTotalVotes > 0;

  const chartData = [
    ...selectedCandidates.map((c) => ({
      name: c.name.split(" ")[0],
      votes: c.voteCount || 0,
      fullName: c.name,
      isSkipped: false,
    })),
    ...(skippedVotes > 0
      ? [
          {
            name: "Skipped",
            votes: skippedVotes,
            fullName: "Skipped / No Vote",
            isSkipped: true,
          },
        ]
      : []),
  ];

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
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-100 pb-6">
          {/* ───── Left: Title Section ───── */}
          <div>
            <p className="text-[#c8a84b] text-[10px] font-black uppercase tracking-widest mb-1">
              Admin Panel
            </p>

            <h1
              className="text-[#1a3a6e] font-black uppercase text-2xl md:text-3xl"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Election Results
            </h1>

            <p className="text-gray-400 text-sm mt-1">
              View results by position
            </p>
          </div>

          {/* ───── Right: Stats + Actions ───── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Live Stats */}
            <div className="hidden md:flex items-center gap-6 bg-white border border-gray-200 rounded-md px-5 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <HowToVoteOutlinedIcon
                  style={{ fontSize: 16 }}
                  className="text-gray-400"
                />
                <span className="text-sm text-gray-600">
                  <span className="font-black text-[#1a3a6e] text-base">
                    {votedCount}
                  </span>{" "}
                  votes
                </span>
              </div>

              <div className="w-px h-5 bg-gray-200" />

              <div className="flex items-center gap-2">
                <PeopleOutlineOutlinedIcon
                  style={{ fontSize: 16 }}
                  className="text-gray-400"
                />
                <span className="text-sm text-gray-600">
                  <span className="font-black text-[#1a3a6e] text-base">
                    {turnout}%
                  </span>{" "}
                  turnout
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-gray-200" />

            {/* Export Button */}
            <button
              onClick={() => exportResults({ positions, candidates, voters })}
              disabled={candidates.length === 0}
              title="Export full report to Excel"
              className="flex items-center gap-2 
        border border-green-600 text-green-600 
        hover:bg-green-600 hover:text-white 
        px-4 py-2 
        text-xs font-bold uppercase tracking-wider 
        rounded-md transition disabled:opacity-40"
            >
              <FileDownloadOutlinedIcon style={{ fontSize: 16 }} />
              Export Report
            </button>

            {/* Refresh Button */}
            <button
              onClick={refresh}
              disabled={refreshing}
              title="Refresh"
              className="flex items-center gap-2 
        border border-gray-300 text-gray-600 
        hover:border-[#1a3a6e] hover:text-[#1a3a6e] 
        px-4 py-2 
        text-xs font-bold uppercase tracking-wider 
        rounded-md transition disabled:opacity-50"
            >
              <RefreshOutlinedIcon
                style={{ fontSize: 16 }}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Position Selector ── */}
        <div className="bg-white border border-gray-100 shadow-sm p-6">
          <label className="text-[#1a3a6e] text-xs font-black uppercase tracking-widest mb-3 block">
            Select Position to View Results
          </label>
          <div className="flex items-center border-2 border-[#1a3a6e] bg-white max-w-md">
            <span className="pl-4 text-[#1a3a6e]">
              <WorkOutlineOutlinedIcon style={{ fontSize: 20 }} />
            </span>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="flex-1 outline-none px-4 py-3 text-sm text-[#1a3a6e] font-bold bg-transparent cursor-pointer"
            >
              {positions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Results Display ── */}
        <div className="flex flex-col gap-6">
          {/* Position header */}
          <div className="text-center">
            <h2
              className="text-[#1a3a6e] text-3xl md:text-4xl font-black uppercase mb-2"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              {selectedPosition}
            </h2>
            <p className="text-gray-400 text-sm">
              {Math.min(selectedTotalVotes, votedCount)} vote
              {Math.min(selectedTotalVotes, votedCount) !== 1 ? "s" : ""} cast
              {selectedTotalVotes > votedCount && (
                <span className="ml-2 text-amber-400 text-xs">
                </span>
              )}
            </p>
          </div>

          {!hasVotes ? (
            <div className="bg-white border border-gray-100 shadow-sm p-16 text-center">
              <p className="text-gray-300 text-sm">
                No votes cast for this position yet.
              </p>
            </div>
          ) : (
            <>
              {/* Winner card & Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Winner card */}
                {/* Winner / Tie card */}
                <div className="bg-white border-2 border-[#c8a84b] shadow-xl overflow-hidden">
                  <div className="relative w-full h-full min-h-[500px]">
                    {isTie ? (
                      /* ── TIE: split photo layout ── */
                      <>
                        <div className="absolute inset-0 flex">
                          {tiedCandidates.map((c, i) => (
                            <div
                              key={c._id}
                              className="relative flex-1 overflow-hidden"
                            >
                              {c.profilePicture ? (
                                <img
                                  src={c.profilePicture}
                                  alt={c.name}
                                  className="absolute inset-0 w-full h-full object-cover object-top"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="absolute inset-0 bg-[#1a3a6e] flex items-center justify-center">
                                  <span className="text-white font-black text-5xl">
                                    {c.name
                                      ?.split(" ")
                                      .map((w) => w[0])
                                      .slice(0, 2)
                                      .join("")
                                      .toUpperCase()}
                                  </span>
                                </div>
                              )}
                              {/* Divider line between photos */}
                              {i < tiedCandidates.length - 1 && (
                                <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-[#c8a84b] z-10" />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Tie ribbon */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 shadow-md z-10">
                          <span>⚖️</span> Tie
                        </div>

                        {/* Bottom gradient with both names */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-6 pt-16 pb-6 flex flex-col items-center gap-2 z-10">
                          <div className="flex items-center gap-2 flex-wrap justify-center">
                            {tiedCandidates.map((c, i) => (
                              <span
                                key={c._id}
                                className="text-white font-black text-xl drop-shadow"
                              >
                                {c.name}
                                {i < tiedCandidates.length - 1 ? (
                                  <span className="text-[#c8a84b] mx-2">
                                    vs
                                  </span>
                                ) : (
                                  ""
                                )}
                              </span>
                            ))}
                          </div>
                          <p className="text-[#c8a84b] text-xs uppercase tracking-widest">
                            {selectedPosition}
                          </p>
                          <div className="flex items-center gap-2 bg-red-500 text-white px-5 py-1.5 mt-1">
                            <HowToVoteOutlinedIcon style={{ fontSize: 16 }} />
                            <span className="font-black text-base">
                              {topVoteCount}
                            </span>
                            <span className="text-xs uppercase tracking-widest">
                              Votes Each
                            </span>
                            {totalForPosition > 0 && (
                              <span className="text-xs opacity-80 ml-1">
                                ·{" "}
                                {Math.round(
                                  (topVoteCount / totalForPosition) * 100,
                                )}
                                % each
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* ── WINNER: single photo layout ── */
                      <>
                        {selectedWinner?.profilePicture ? (
                          <img
                            src={selectedWinner.profilePicture}
                            alt={selectedWinner.name}
                            className="absolute inset-0 w-full h-full object-cover object-top"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[#1a3a6e] flex items-center justify-center">
                            <span className="text-white font-black text-6xl">
                              {selectedWinner?.name
                                ?.split(" ")
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* Winner ribbon */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#c8a84b] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 shadow-md z-10">
                          <EmojiEventsOutlinedIcon style={{ fontSize: 14 }} />
                          Winner
                        </div>

                        {/* Gradient overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 pt-16 pb-6 flex flex-col items-center gap-2 z-10">
                          <p className="text-white font-black text-2xl drop-shadow">
                            {selectedWinner?.name}
                          </p>
                          <p className="text-[#c8a84b] text-xs uppercase tracking-widest">
                            {selectedPosition}
                          </p>
                          <div className="flex items-center gap-2 bg-[#c8a84b] text-white px-5 py-1.5 mt-1">
                            <HowToVoteOutlinedIcon style={{ fontSize: 16 }} />
                            <span className="font-black text-base">
                              {Math.round(
                                ((selectedWinner?.voteCount || 0) /
                                  totalForPosition) *
                                  100,
                              )}
                              %
                            </span>
                            <span className="text-xs uppercase tracking-widest">
                              Votes
                            </span>
                            <span className="text-xs opacity-80 ml-1">
                              · {selectedWinner?.voteCount || 0}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Chart */}
                <div className="bg-white border border-gray-100 shadow-sm p-6 flex flex-col min-h-[500px]">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                    <WorkOutlineOutlinedIcon
                      style={{ fontSize: 18 }}
                      className="text-[#1a3a6e]"
                    />
                    <p className="text-[#1a3a6e] font-black text-sm uppercase tracking-wide">
                      Vote Distribution
                    </p>
                  </div>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                              fill={
                                entry.isSkipped
                                  ? "#d1d5db"
                                  : index === 0
                                    ? "#c8a84b"
                                    : "#1a3a6e"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              {/* Full candidate list */}
              <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <p className="text-[#1a3a6e] font-black text-sm uppercase tracking-wide">
                    All Candidates - {selectedPosition}
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {selectedCandidates.map((c, i) => {
                    const percentage =
                      totalForPosition > 0
                        ? Math.round(
                            ((c.voteCount || 0) / totalForPosition) * 100,
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

                  {skippedVotes > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-50/60">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gray-100 text-gray-400 font-black text-sm">
                          —
                        </span>
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                          <span className="text-gray-400 text-xs font-black">
                            ?
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-500 font-bold text-sm">
                            Skipped / No Vote
                          </p>
                          <p className="text-gray-300 text-xs">
                            Voters who did not select a candidate
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <p className="text-gray-400 font-black text-xl">
                            {skippedVotes}
                          </p>
                          <p className="text-gray-300 text-xs">
                            {totalForPosition > 0
                              ? Math.round(
                                  (skippedVotes / totalForPosition) * 100,
                                )
                              : 0}
                            %
                          </p>
                        </div>
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-300 rounded-full transition-all"
                            style={{
                              width: `${totalForPosition > 0 ? Math.round((skippedVotes / totalForPosition) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results;
