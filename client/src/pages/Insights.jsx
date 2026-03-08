import { useState, useEffect, useCallback } from "react";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import { Link } from "react-router-dom";

const API = "http://localhost:3000/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

// ── Large stat card ──
const StatCard = ({ icon, label, value, subtext, accent, trend }) => (
  <div className="bg-white border border-gray-100 shadow-sm p-6 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div
        className="w-12 h-12 rounded-sm flex items-center justify-center"
        style={{ background: accent + "18" }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 text-xs font-bold ${
            trend > 0 ? "text-green-600" : "text-gray-400"
          }`}
        >
          <TrendingUpOutlinedIcon style={{ fontSize: 14 }} />
          {trend > 0 ? `+${trend}%` : "—"}
        </div>
      )}
    </div>
    <div>
      <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-1">
        {label}
      </p>
      <p className="text-[#0a6b1b] text-3xl font-black">{value}</p>
      {subtext && <p className="text-gray-400 text-xs mt-1">{subtext}</p>}
    </div>
  </div>
);

// ── Progress bar ──
const ProgressBar = ({ label, value, total, color = "#0a6b1b" }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-[#0a6b1b] font-black">
          {value} / {total}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-gray-400 text-xs text-right">{percentage}% complete</p>
    </div>
  );
};

// ── Section card ──
const Section = ({ title, icon, children, action }) => (
  <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <div className="flex items-center gap-2.5">
        <span className="text-[#0a6b1b]">{icon}</span>
        <h3 className="text-[#0a6b1b] font-black text-sm uppercase tracking-wide">
          {title}
        </h3>
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ── Avatar fallback ──
const Avatar = ({ src, name }) => {
  const [err, setErr] = useState(false);
  const initials = name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (!src || err) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#0a6b1b] text-white font-black flex items-center justify-center shrink-0 text-sm">
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErr(true)}
      className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-gray-100"
    />
  );
};

const Insights = () => {
  const [loading, setLoading] = useState(true);
  const [voters, setVoters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [settings, setSettings] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch all data ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [votersRes, candidatesRes, settingsRes] = await Promise.all([
        fetch(`${API}/voters`, { headers: authHeaders() }),
        fetch(`${API}/candidates`, { headers: authHeaders() }),
        fetch(`${API}/settings`, { headers: authHeaders() }),
      ]);

      const [votersData, candidatesData, settingsData] = await Promise.all([
        votersRes.json(),
        candidatesRes.json(),
        settingsRes.json(),
      ]);

      setVoters(votersData);
      setCandidates(candidatesData);
      setSettings(settingsData);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await fetchData();
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Computed metrics ──
  const totalVoters = voters.length;
  const votedCount = voters.filter((v) => v.hasVoted).length;
  const pendingCount = totalVoters - votedCount;
  const turnoutPercent =
    totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;
  const totalCandidates = candidates.length;
  const totalVotes = candidates.reduce((s, c) => s + (c.voteCount || 0), 0);

  // Group candidates by position
  const byPosition = candidates.reduce((acc, c) => {
    if (!acc[c.position]) acc[c.position] = [];
    acc[c.position].push(c);
    return acc;
  }, {});

  // Top 5 candidates overall
  const topCandidates = [...candidates]
    .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
    .slice(0, 3);

  // Election status
  const now = new Date();
  const start =
    settings?.electionPeriod?.startDate && settings?.electionPeriod?.startTime
      ? new Date(
          `${settings.electionPeriod.startDate}T${settings.electionPeriod.startTime}`,
        )
      : null;
  const end =
    settings?.electionPeriod?.endDate && settings?.electionPeriod?.endTime
      ? new Date(
          `${settings.electionPeriod.endDate}T${settings.electionPeriod.endTime}`,
        )
      : null;

  let electionStatus = "Not Configured";
  let statusColor = "gray";
  if (start && end) {
    if (now < start) {
      electionStatus = "Upcoming";
      statusColor = "blue";
    } else if (now >= start && now <= end) {
      electionStatus = "Live";
      statusColor = "green";
    } else {
      electionStatus = "Ended";
      statusColor = "red";
    }
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="w-48 h-8 bg-gray-100 rounded animate-pulse" />
            <div className="w-24 h-10 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white border border-gray-100 p-6 flex flex-col gap-3 animate-pulse"
              >
                <div className="w-12 h-12 bg-gray-100 rounded" />
                <div className="w-32 h-8 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
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
              className="text-[#0a6b1b] font-black uppercase text-2xl md:text-3xl"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Insights & Analytics
            </h1>

            <p className="text-gray-400 text-sm mt-1">
              Real-time election metrics and performance overview.
            </p>
          </div>

          {/* ───── Right: Actions ───── */}
          <div className="flex items-center gap-3">
            {/* Secondary Action — Refresh */}
            <button
              onClick={refresh}
              disabled={refreshing}
              className="flex items-center gap-2 
        border border-gray-300 
        text-gray-600 
        hover:border-[#0a6b1b] hover:text-[#0a6b1b] 
        px-4 py-2 
        text-xs font-bold uppercase tracking-wider 
        rounded-md 
        transition disabled:opacity-50"
            >
              <RefreshOutlinedIcon
                style={{ fontSize: 16 }}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            {/* Primary Action — Live Voting */}
            <Link
              to="/admin/live-voting"
              className="flex items-center gap-2 
        bg-[#0a6b1b] hover:bg-[#c8a84b] 
        text-white 
        px-5 py-2.5 
        text-xs font-black uppercase tracking-widest 
        rounded-md shadow-md 
        transition"
            >
              <LiveTvIcon style={{ fontSize: 17 }} />
              Live Voting
            </Link>
          </div>
        </div>

        {/* ── Election Status Banner ── */}
        {start && end && (
          <div
            className={`border-l-4 px-6 py-4 flex items-center justify-between ${
              statusColor === "green"
                ? "bg-green-50 border-green-500"
                : statusColor === "blue"
                  ? "bg-blue-50 border-blue-500"
                  : statusColor === "red"
                    ? "bg-red-50 border-red-500"
                    : "bg-gray-50 border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <TimerOutlinedIcon
                className={
                  statusColor === "green"
                    ? "text-green-600"
                    : statusColor === "blue"
                      ? "text-blue-600"
                      : statusColor === "red"
                        ? "text-red-600"
                        : "text-gray-400"
                }
                style={{ fontSize: 24 }}
              />
              <div>
                <p
                  className={`font-black text-sm uppercase tracking-wide ${
                    statusColor === "green"
                      ? "text-green-600"
                      : statusColor === "blue"
                        ? "text-blue-600"
                        : statusColor === "red"
                          ? "text-red-600"
                          : "text-gray-600"
                  }`}
                >
                  Election Status: {electionStatus}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {statusColor === "green" && "Voting is currently open"}
                  {statusColor === "blue" && `Starts ${start.toLocaleString()}`}
                  {statusColor === "red" && `Ended ${end.toLocaleString()}`}
                </p>
              </div>
            </div>
            {statusColor === "green" && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-600 text-xs font-bold uppercase tracking-wider">
                  Active
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Top Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<PeopleOutlineOutlinedIcon style={{ fontSize: 26 }} />}
            label="Total Voters"
            value={totalVoters.toLocaleString()}
            subtext={`${votedCount} voted, ${pendingCount} pending`}
            accent="#0a6b1b"
          />
          <StatCard
            icon={<HowToVoteOutlinedIcon style={{ fontSize: 26 }} />}
            label="Voter Turnout"
            value={`${turnoutPercent}%`}
            subtext={`${votedCount} of ${totalVoters} voters`}
            accent="#16a34a"
            trend={turnoutPercent}
          />
          <StatCard
            icon={<PersonOutlineOutlinedIcon style={{ fontSize: 26 }} />}
            label="Candidates"
            value={totalCandidates}
            subtext={`Across ${Object.keys(byPosition).length} positions`}
            accent="#c8a84b"
          />
          <StatCard
            icon={<EmojiEventsOutlinedIcon style={{ fontSize: 26 }} />}
            label="Total Votes"
            value={votedCount}
            subtext={
              totalVotes > 0
                ? `Avg ${Math.round(totalVotes / totalCandidates)} per candidate`
                : "No votes yet"
            }
            accent="#8b5cf6"
          />
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Voting Progress */}
          <Section
            title="Voting Progress"
            icon={<CheckCircleOutlineOutlinedIcon style={{ fontSize: 20 }} />}
          >
            <div className="flex flex-col gap-6">
              <ProgressBar
                label="Voters who have cast ballots"
                value={votedCount}
                total={totalVoters}
                color="#16a34a"
              />
              <ProgressBar
                label="Pending voters"
                value={pendingCount}
                total={totalVoters}
                color="#c8a84b"
              />

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <CheckCircleOutlineOutlinedIcon
                      style={{ fontSize: 18 }}
                      className="text-green-600"
                    />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                      Voted
                    </p>
                    <p className="text-[#0a6b1b] text-xl font-black">
                      {votedCount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <PendingOutlinedIcon
                      style={{ fontSize: 18 }}
                      className="text-amber-600"
                    />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                      Pending
                    </p>
                    <p className="text-[#0a6b1b] text-xl font-black">
                      {pendingCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Right: Top Candidates */}
          <Section
            title="Leading Candidates"
            icon={<EmojiEventsOutlinedIcon style={{ fontSize: 20 }} />}
          >
            {topCandidates.length === 0 ? (
              <p className="text-gray-300 text-sm text-center py-8">
                No candidates yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {topCandidates.map((c, i) => (
                  <div
                    key={c._id}
                    className="flex items-center gap-4 p-3 border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
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
                    <Avatar src={c.profilePicture} name={c.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-700 truncate">
                        {c.name}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {c.position}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[#0a6b1b] font-black text-lg">
                        {c.voteCount || 0}
                      </p>
                      <p className="text-gray-400 text-[10px] uppercase tracking-widest">
                        votes
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* ── Position Breakdown ── */}
        <Section
          title="Votes by Position"
          icon={<WorkOutlineOutlinedIcon style={{ fontSize: 20 }} />}
        >
          {Object.keys(byPosition).length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">
              No positions configured yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(byPosition).map(([position, cands]) => {
                const positionVotes = cands.reduce(
                  (s, c) => s + (c.voteCount || 0),
                  0,
                );
                const leader = cands.sort(
                  (a, b) => (b.voteCount || 0) - (a.voteCount || 0),
                )[0];
                return (
                  <div
                    key={position}
                    className="border border-gray-100 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-[#0a6b1b] font-black text-sm uppercase tracking-wide">
                        {position}
                      </h4>
                      <span className="text-gray-400 text-xs font-semibold">
                        {cands.length} candidates
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                      <Avatar src={leader.profilePicture} name={leader.name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-700 text-sm truncate">
                          {leader.name}
                        </p>
                        <p className="text-gray-400 text-xs">Current Leader</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[#0a6b1b] font-black text-xl">
                          {leader.voteCount || 0}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        Total votes in position
                      </span>
                      <span className="text-[#0a6b1b] font-black">
                        {positionVotes}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
};

export default Insights;
