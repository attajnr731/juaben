import { useState, useEffect, useCallback } from "react";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

const API = "http://localhost:3000/api";

// ── Auth header helper ──
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

// ── Reusable section card ──
const SectionCard = ({ icon, title, subtitle, children }) => (
  <div className="bg-white border border-gray-100 shadow-sm">
    <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
      <div
        className="w-9 h-9 rounded-sm flex items-center justify-center text-[#1a3a6e]"
        style={{ background: "rgba(26,58,110,0.08)" }}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-[#1a3a6e] font-black text-sm uppercase tracking-wide">
          {title}
        </h3>
        <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>
      </div>
    </div>
    <div className="px-6 py-6">{children}</div>
  </div>
);

// ── Status pill (success / error) ──
const StatusPill = ({ status, message }) => {
  if (!message) return null;
  const isError = status === "error";
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border ${
        isError
          ? "bg-red-50 border-red-200 text-red-600"
          : "bg-green-50 border-green-200 text-green-600"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${isError ? "bg-red-500" : "bg-green-500"}`}
      />
      {message}
    </div>
  );
};

const Settings = () => {
  const [pageLoading, setPageLoading] = useState(true);

  // ── Election Period ──
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [periodStatus, setPeriodStatus] = useState({ status: "", message: "" });
  const [periodLoading, setPeriodLoading] = useState(false);

  // ── Positions ──
  const [positions, setPositions] = useState([]);
  const [newPosition, setNewPosition] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [posStatus, setPosStatus] = useState({ status: "", message: "" });
  const [posLoading, setPosLoading] = useState(false);

  // ── Passcode ──
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passStatus, setPassStatus] = useState({ status: "", message: "" });
  const [passLoading, setPassLoading] = useState(false);

  // ── Fetch settings on mount ──
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/settings`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const p = data.electionPeriod || {};
      setStartDate(p.startDate || "");
      setStartTime(p.startTime || "");
      setEndDate(p.endDate || "");
      setEndTime(p.endTime || "");
      setPositions(data.positions || []);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ── Save election period ──
  const savePeriod = async () => {
    setPeriodLoading(true);
    setPeriodStatus({ status: "", message: "" });
    try {
      const res = await fetch(`${API}/settings/period`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ startDate, startTime, endDate, endTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPeriodStatus({ status: "success", message: data.message });
    } catch (err) {
      setPeriodStatus({
        status: "error",
        message: err.message || "Failed to save.",
      });
    } finally {
      setPeriodLoading(false);
      setTimeout(() => setPeriodStatus({ status: "", message: "" }), 3000);
    }
  };

  // ── Position helpers ──
  const savePositions = async (updated) => {
    setPosLoading(true);
    setPosStatus({ status: "", message: "" });
    try {
      const res = await fetch(`${API}/settings/positions`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ positions: updated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPositions(data.positions);
      setPosStatus({ status: "success", message: data.message });
    } catch (err) {
      setPosStatus({
        status: "error",
        message: err.message || "Failed to update positions.",
      });
    } finally {
      setPosLoading(false);
      setTimeout(() => setPosStatus({ status: "", message: "" }), 3000);
    }
  };

  const addPosition = () => {
    if (!newPosition.trim()) return;
    const updated = [...positions, newPosition.trim()];
    setNewPosition("");
    savePositions(updated);
  };

  const confirmEdit = () => {
    if (!editValue.trim()) return;
    const updated = positions.map((p, i) =>
      i === editIndex ? editValue.trim() : p,
    );
    setEditIndex(null);
    savePositions(updated);
  };

  const doDelete = () => {
    const updated = positions.filter((_, i) => i !== deleteIndex);
    setDeleteIndex(null);
    savePositions(updated);
  };

  // ── Save passcode ──
  const savePasscode = async () => {
    setPassStatus({ status: "", message: "" });
    if (passcode.length < 4) {
      setPassStatus({
        status: "error",
        message: "Passcode must be at least 4 characters.",
      });
      return;
    }
    if (passcode !== confirmPasscode) {
      setPassStatus({ status: "error", message: "Passcodes do not match." });
      return;
    }
    setPassLoading(true);
    try {
      const res = await fetch(`${API}/settings/passcode`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPassStatus({ status: "success", message: data.message });
      setPasscode("");
      setConfirmPasscode("");
    } catch (err) {
      setPassStatus({
        status: "error",
        message: err.message || "Failed to update passcode.",
      });
    } finally {
      setPassLoading(false);
      setTimeout(() => setPassStatus({ status: "", message: "" }), 3000);
    }
  };

  // ── Loading skeleton ──
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 md:px-8 py-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border border-gray-100 shadow-sm animate-pulse"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-sm bg-gray-100" />
                <div className="flex flex-col gap-2">
                  <div className="w-32 h-3 bg-gray-100 rounded" />
                  <div className="w-48 h-2.5 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="px-6 py-6 flex flex-col gap-3">
                <div className="w-full h-10 bg-gray-100 rounded" />
                <div className="w-3/4 h-10 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 py-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Page header */}
        <div className="mb-2">
          <p className="text-[#c8a84b] text-[10px] font-black uppercase tracking-widest mb-1">
            Admin Panel
          </p>
          <h1
            className="text-[#1a3a6e] font-black uppercase text-2xl md:text-3xl"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Settings
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure election period, positions, and access controls.
          </p>
        </div>

        {/* ── 1. ELECTION PERIOD ── */}
        <SectionCard
          icon={<AccessTimeOutlinedIcon style={{ fontSize: 20 }} />}
          title="Election Period"
          subtitle="Set when voting opens and closes"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
                Start
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-2 border-gray-200 focus:border-[#1a3a6e] outline-none px-4 py-2.5 text-sm text-gray-700 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="border-2 border-gray-200 focus:border-[#1a3a6e] outline-none px-4 py-2.5 text-sm text-gray-700 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
                End
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-2 border-gray-200 focus:border-[#1a3a6e] outline-none px-4 py-2.5 text-sm text-gray-700 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="border-2 border-gray-200 focus:border-[#1a3a6e] outline-none px-4 py-2.5 text-sm text-gray-700 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <StatusPill {...periodStatus} />
            <button
              onClick={savePeriod}
              disabled={periodLoading}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest bg-[#1a3a6e] hover:bg-[#c8a84b] disabled:opacity-60 text-white transition-all duration-300 shadow-sm ml-auto"
            >
              {periodLoading ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
              ) : (
                <SaveOutlinedIcon style={{ fontSize: 16 }} />
              )}
              {periodLoading ? "Saving…" : "Save Period"}
            </button>
          </div>
        </SectionCard>

        {/* ── 2. POSITIONS ── */}
        <SectionCard
          icon={<WorkOutlineOutlinedIcon style={{ fontSize: 20 }} />}
          title="Positions"
          subtitle="Manage electable positions for this election"
        >
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPosition()}
              placeholder="e.g. Finance Prefect"
              className="flex-1 border-2 border-gray-200 focus:border-[#1a3a6e] outline-none px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 transition-colors"
            />
            <button
              onClick={addPosition}
              disabled={posLoading}
              className="flex items-center gap-1.5 bg-[#1a3a6e] hover:bg-[#c8a84b] disabled:opacity-60 text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-sm whitespace-nowrap"
            >
              <AddOutlinedIcon style={{ fontSize: 16 }} />
              Add
            </button>
          </div>

          {positions.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-6">
              No positions added yet.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100 border border-gray-100">
              {positions.map((pos, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span
                    className="w-6 h-6 rounded-full text-[#1a3a6e] text-[10px] font-black flex items-center justify-center shrink-0"
                    style={{ background: "rgba(26,58,110,0.08)" }}
                  >
                    {i + 1}
                  </span>

                  {editIndex === i ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmEdit();
                        if (e.key === "Escape") setEditIndex(null);
                      }}
                      className="flex-1 border-2 border-[#1a3a6e] outline-none px-3 py-1 text-sm text-gray-700"
                    />
                  ) : (
                    <span className="flex-1 text-sm text-gray-600 font-medium">
                      {pos}
                    </span>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    {editIndex === i ? (
                      <>
                        <button
                          onClick={confirmEdit}
                          className="p-1.5 rounded hover:bg-green-50 text-green-500 transition-colors"
                        >
                          <CheckOutlinedIcon style={{ fontSize: 16 }} />
                        </button>
                        <button
                          onClick={() => setEditIndex(null)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 transition-colors"
                        >
                          <CloseOutlinedIcon style={{ fontSize: 16 }} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditIndex(i);
                            setEditValue(pos);
                          }}
                          className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-[#1a3a6e] transition-colors"
                        >
                          <EditOutlinedIcon style={{ fontSize: 16 }} />
                        </button>
                        <button
                          onClick={() => setDeleteIndex(i)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <DeleteOutlineOutlinedIcon style={{ fontSize: 16 }} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between mt-3">
            <p className="text-gray-400 text-xs">
              {positions.length} position{positions.length !== 1 ? "s" : ""}{" "}
              configured
            </p>
            {posStatus.message && <StatusPill {...posStatus} />}
          </div>
        </SectionCard>

        {/* ── 3. VOTING PASSCODE ── */}
        <SectionCard
          icon={<LockOutlinedIcon style={{ fontSize: 20 }} />}
          title="Voting Auth Passcode"
          subtitle="Students must enter this passcode to access the voting portal"
        >
          <div className="flex flex-col gap-4 max-w-sm">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                New Passcode
              </label>
              <div
                className={`flex items-center border-2 transition-colors ${
                  passStatus.status === "error"
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 focus-within:border-[#1a3a6e] bg-white"
                }`}
              >
                <span className="pl-4 text-gray-400">
                  <LockOutlinedIcon style={{ fontSize: 17 }} />
                </span>
                <input
                  type={showPasscode ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setPassStatus({ status: "", message: "" });
                  }}
                  placeholder="Enter new passcode"
                  className="flex-1 bg-transparent outline-none px-3 py-3 text-sm text-gray-700 placeholder-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode((v) => !v)}
                  className="pr-4 text-gray-400 hover:text-[#1a3a6e] transition-colors"
                >
                  {showPasscode ? (
                    <VisibilityOffOutlinedIcon style={{ fontSize: 17 }} />
                  ) : (
                    <VisibilityOutlinedIcon style={{ fontSize: 17 }} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Confirm Passcode
              </label>
              <div
                className={`flex items-center border-2 transition-colors ${
                  passStatus.status === "error"
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 focus-within:border-[#1a3a6e] bg-white"
                }`}
              >
                <span className="pl-4 text-gray-400">
                  <LockOutlinedIcon style={{ fontSize: 17 }} />
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPasscode}
                  onChange={(e) => {
                    setConfirmPasscode(e.target.value);
                    setPassStatus({ status: "", message: "" });
                  }}
                  placeholder="Re-enter passcode"
                  className="flex-1 bg-transparent outline-none px-3 py-3 text-sm text-gray-700 placeholder-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="pr-4 text-gray-400 hover:text-[#1a3a6e] transition-colors"
                >
                  {showConfirm ? (
                    <VisibilityOffOutlinedIcon style={{ fontSize: 17 }} />
                  ) : (
                    <VisibilityOutlinedIcon style={{ fontSize: 17 }} />
                  )}
                </button>
              </div>
            </div>

            {passStatus.message && <StatusPill {...passStatus} />}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 flex justify-end max-w-sm">
            <button
              onClick={savePasscode}
              disabled={passLoading}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest bg-[#1a3a6e] hover:bg-[#c8a84b] disabled:opacity-60 text-white transition-all duration-300 shadow-sm"
            >
              {passLoading ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
              ) : (
                <SaveOutlinedIcon style={{ fontSize: 16 }} />
              )}
              {passLoading ? "Saving…" : "Update Passcode"}
            </button>
          </div>
        </SectionCard>
      </div>

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && setDeleteIndex(null)}
        >
          <div className="bg-white w-full max-w-sm shadow-2xl">
            <div className="bg-red-500 px-6 py-4 flex items-center gap-2">
              <DeleteOutlineOutlinedIcon
                style={{ fontSize: 20 }}
                className="text-white"
              />
              <span className="text-white font-black text-sm uppercase tracking-widest">
                Remove Position
              </span>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-600 text-sm mb-1">
                Are you sure you want to remove:
              </p>
              <p className="text-[#1a3a6e] font-black text-base mb-6">
                "{positions[deleteIndex]}"
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteIndex(null)}
                  className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-400 font-bold text-xs uppercase tracking-widest py-3 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={doDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest py-3 transition-all"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
