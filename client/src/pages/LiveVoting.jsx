import { useState, useEffect, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

const API = "https://juaben.onrender.com/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

// ── Large stat card ──
const StatCard = ({ icon, label, value, subtext, accent, percentage }) => (
  <div className="bg-white border-2 border-gray-100 shadow-lg p-8 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: accent + "20" }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      {percentage !== undefined && (
        <div
          className={`flex items-center gap-1 text-sm font-bold ${percentage > 0 ? "text-green-600" : "text-gray-400"}`}
        >
          <TrendingUpOutlinedIcon style={{ fontSize: 18 }} />
          {percentage > 0 ? `${percentage}%` : "—"}
        </div>
      )}
    </div>
    <div>
      <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">
        {label}
      </p>
      <p className="text-[#1a3a6e] text-4xl font-black mb-1">{value}</p>
      {subtext && <p className="text-gray-400 text-sm">{subtext}</p>}
    </div>
  </div>
);

// ── Custom pie chart label ──
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
  value,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // hide very small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="font-bold text-sm"
    >
      <tspan x={x} dy="-0.3em">
        {name}
      </tspan>
      <tspan x={x} dy="1.2em">
        {value} ({(percent * 100).toFixed(0)}%)
      </tspan>
    </text>
  );
};

// ── Custom tooltip ──
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-[#1a3a6e] shadow-xl px-5 py-4">
        <p className="text-[#1a3a6e] font-black text-sm mb-2">
          {payload[0].name}
        </p>
        <p className="text-gray-600 text-lg font-bold">
          {payload[0].value.toLocaleString()} voters
        </p>
        <p className="text-gray-400 text-xs mt-1">
          {((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}% of
          total
        </p>
      </div>
    );
  }
  return null;
};

// ── Spinner ──
const Spinner = () => (
  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
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

const LiveVoting = () => {
  const [loading, setLoading] = useState(true);
  const [voters, setVoters] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/voters`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setVoters(data);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch voters:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchData();
    }, 30000); // 60 seconds

    return () => clearInterval(interval);
  }, [fetchData]);

  const manualRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Calculate stats
  const totalVoters = voters.length;
  const votedCount = voters.filter((v) => v.hasVoted).length;
  const pendingCount = totalVoters - votedCount;
  const turnoutPercent =
    totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;

  // Pie chart data
  const pieData = [
    { name: "Voted", value: votedCount, color: "#16a34a", total: totalVoters },
    {
      name: "Not Voted",
      value: pendingCount,
      color: "#c8a84b",
      total: totalVoters,
    },
  ];

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-gray-400 text-sm">Loading live data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[#c8a84b] text-[10px] font-black uppercase tracking-widest mb-1">
              Live Dashboard
            </p>
            <h1
              className="text-[#1a3a6e] font-black uppercase text-2xl md:text-3xl"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Voting Progress
            </h1>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
              <AccessTimeOutlinedIcon style={{ fontSize: 14 }} />
              Last updated: {formatTime(lastUpdate)}
            </p>
          </div>

          <button
            onClick={manualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-[#1a3a6e] hover:bg-[#c8a84b] disabled:opacity-60 text-white px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <RefreshOutlinedIcon
              style={{ fontSize: 18 }}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing…" : "Refresh Now"}
          </button>
        </div>

        {/* ── Main Content: Pie Chart ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Huge Pie Chart */}
          <div className="bg-white border border-gray-100 shadow-lg p-8 flex flex-col items-center justify-center">
            <h3 className="text-[#1a3a6e] font-black text-xl uppercase tracking-wide mb-6 text-center">
              Voter Turnout Distribution
            </h3>

            {totalVoters === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-300 text-sm">
                  No voters registered yet.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-8 mt-6">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <FiberManualRecordIcon
                    style={{ fontSize: 16, color: entry.color }}
                  />
                  <span className="text-gray-600 text-sm font-semibold">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Progress Breakdown */}
          <div className="bg-white border border-gray-100 shadow-lg p-8 flex flex-col justify-center gap-8">
            <div>
              <h3 className="text-[#1a3a6e] font-black text-lg uppercase tracking-wide mb-6">
                Live Turnout Metrics
              </h3>

              {/* Voted progress */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <span className="text-gray-600 font-bold text-sm">
                      Voters Who Voted
                    </span>
                  </div>
                  <span className="text-[#1a3a6e] font-black text-xl">
                    {votedCount}
                  </span>
                </div>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${turnoutPercent}%` }}
                  />
                </div>
                <p className="text-gray-400 text-xs mt-2 text-right">
                  {turnoutPercent}% of registered voters
                </p>
              </div>

              {/* Pending progress */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#c8a84b]" />
                    <span className="text-gray-600 font-bold text-sm">
                      Pending Voters
                    </span>
                  </div>
                  <span className="text-[#1a3a6e] font-black text-xl">
                    {pendingCount}
                  </span>
                </div>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#c8a84b] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${100 - turnoutPercent}%` }}
                  />
                </div>
                <p className="text-gray-400 text-xs mt-2 text-right">
                  {100 - turnoutPercent}% yet to vote
                </p>
              </div>
            </div>

            {/* Summary box */}
            <div className="bg-[#1a3a6e] text-white p-6 rounded-sm">
              <p className="text-[#c8a84b] text-xs uppercase tracking-widest font-bold mb-3">
                Current Status
              </p>
              <p className="text-4xl font-black mb-2">{turnoutPercent}%</p>
              <p className="text-white/80 text-sm">
                {votedCount} out of {totalVoters} voters have cast their ballots
              </p>
              {turnoutPercent >= 75 && (
                <div className="mt-4 flex items-center gap-2 text-green-400 text-xs font-bold">
                  <TrendingUpOutlinedIcon style={{ fontSize: 14 }} />
                  High turnout achieved!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveVoting;
