import { useState, useEffect, useRef, useCallback } from "react";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import RemoveCircleOutlineOutlinedIcon from "@mui/icons-material/RemoveCircleOutlineOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import * as XLSX from "xlsx";

const API = "https://juaben.onrender.com/api";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

// ── Export voters to Excel ──
const exportVoters = (voters) => {
  const rows = voters.map((v, i) => ({
    "#": i + 1,
    "Student ID": v.studentId,
    Name: v.name,
    "Has Voted": v.hasVoted ? "Yes" : "No",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 5 }, { wch: 16 }, { wch: 28 }, { wch: 12 }];

  // Color-code the "Has Voted" column header
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Voters");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `voters_${date}.xlsx`);
};

// ── Stat card ──
const Stat = ({ icon, label, value, accent }) => (
  <div className="bg-white border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
    <div
      className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
      style={{ background: accent + "18" }}
    >
      <span style={{ color: accent }}>{icon}</span>
    </div>
    <div>
      <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">
        {label}
      </p>
      <p className="text-[#1a3a6e] text-xl font-black">{value}</p>
    </div>
  </div>
);

// ── Toast ──
const Toast = ({ toast }) => {
  if (!toast.message) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 shadow-xl text-sm font-semibold border ${toast.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}
      />
      {toast.message}
    </div>
  );
};

const Voters = () => {
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "" });

  const [addOpen, setAddOpen] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [addErrors, setAddErrors] = useState({});
  const [addLoading, setAddLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  const [resetAllOpen, setResetAllOpen] = useState(false);
  const [resetAllLoading, setResetAllLoading] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkError, setBulkError] = useState("");
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const fileRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3500);
  };

  const fetchVoters = useCallback(async (searchTerm = "") => {
    setLoading(true);
    try {
      const query = searchTerm
        ? `?search=${encodeURIComponent(searchTerm)}`
        : "";
      const res = await fetch(`${API}/voters${query}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setVoters(data);
    } catch (err) {
      showToast(err.message || "Failed to load voters.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVoters();
  }, [fetchVoters]);

  useEffect(() => {
    const t = setTimeout(() => fetchVoters(search), 350);
    return () => clearTimeout(t);
  }, [search, fetchVoters]);

  const votedCount = voters.filter((v) => v.hasVoted).length;
  const pendingCount = voters.length - votedCount;

  const validateAdd = () => {
    const e = {};
    if (!newId.trim()) e.id = "ID is required.";
    if (!newName.trim()) e.name = "Name is required.";
    return e;
  };

  const handleAdd = async () => {
    const e = validateAdd();
    if (Object.keys(e).length) {
      setAddErrors(e);
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch(`${API}/voters`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ studentId: newId.trim(), name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message?.toLowerCase().includes("already exists")) {
          setAddErrors({ id: data.message });
          return;
        }
        throw new Error(data.message);
      }
      setVoters((p) => [data.voter, ...p]);
      setNewId("");
      setNewName("");
      setAddErrors({});
      setAddOpen(false);
      showToast("Voter added successfully.");
    } catch (err) {
      showToast(err.message || "Failed to add voter.", "error");
    } finally {
      setAddLoading(false);
    }
  };

  const doDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API}/voters/${deleteTarget._id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setVoters((p) => p.filter((v) => v._id !== deleteTarget._id));
      showToast("Voter removed.");
    } catch (err) {
      showToast(err.message || "Failed to delete voter.", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const doDeleteAll = async () => {
    setDeleteAllLoading(true);
    try {
      const res = await fetch(`${API}/voters`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setVoters([]);
      showToast(data.message);
    } catch (err) {
      showToast(err.message || "Failed to delete voters.", "error");
    } finally {
      setDeleteAllLoading(false);
      setDeleteAllOpen(false);
    }
  };

  const doResetAll = async () => {
    setResetAllLoading(true);
    try {
      const res = await fetch(`${API}/voters/reset`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setVoters([]);
      showToast(data.message);
    } catch (err) {
      showToast(err.message || "Failed to reset voters.", "error");
    } finally {
      setResetAllLoading(false);
      setResetAllOpen(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkError("");
    setBulkFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        const parsed = rows
          .map((r) => ({
            studentId: String(r["id"] || r["ID"] || r["Id"] || "").trim(),
            name: String(r["Name"] || r["name"] || r["NAME"] || "").trim(),
          }))
          .filter((r) => r.studentId && r.name);
        if (!parsed.length) {
          setBulkError("No valid rows found. Columns must be 'id' and 'Name'.");
          setBulkPreview([]);
          return;
        }
        setBulkPreview(parsed);
      } catch {
        setBulkError("Failed to parse file. Upload a valid .xlsx or .csv.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleBulkImport = async () => {
    setBulkLoading(true);
    try {
      const res = await fetch(`${API}/voters/bulk`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ voters: bulkPreview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchVoters(search);
      showToast(data.message);
      setBulkPreview([]);
      setBulkFileName("");
      setBulkOpen(false);
    } catch (err) {
      showToast(err.message || "Bulk import failed.", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const newCount = bulkPreview.filter(
    (r) => !voters.some((v) => v.studentId === r.studentId),
  ).length;

  const SpinnerSvg = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
  );

  const SkeletonRows = () => (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-50">
          <td className="px-6 py-4">
            <div className="w-5 h-3 bg-gray-100 rounded animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="w-20 h-5 bg-gray-100 rounded animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="w-36 h-3 bg-gray-100 rounded animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="w-14 h-5 bg-gray-100 rounded animate-pulse" />
          </td>
          <td className="px-6 py-4" />
        </tr>
      ))}
    </>
  );

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
              Voters
            </h1>

            <p className="text-gray-400 text-sm mt-1">
              Manage registered voters for the election.
            </p>
          </div>

          {/* ───── Right: Actions Section ───── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search + Refresh group */}
            <div className="flex items-center gap-2">
              {searchOpen ? (
                <div className="flex items-center border border-gray-300 bg-white rounded-md shadow-sm">
                  <span className="pl-3 text-gray-400">
                    <SearchOutlinedIcon style={{ fontSize: 18 }} />
                  </span>
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search ID or name…"
                    className="w-48 outline-none px-3 py-2 text-sm text-gray-700 placeholder-gray-300 bg-transparent"
                  />
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      setSearch("");
                    }}
                    className="pr-3 text-gray-400 hover:text-[#1a3a6e]"
                  >
                    <CloseOutlinedIcon style={{ fontSize: 16 }} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2.5 border border-gray-300 rounded-md text-gray-500 hover:border-[#1a3a6e] hover:text-[#1a3a6e] transition"
                >
                  <SearchOutlinedIcon style={{ fontSize: 20 }} />
                </button>
              )}

              <button
                onClick={() => fetchVoters(search)}
                title="Refresh"
                className="p-2.5 border border-gray-300 rounded-md text-gray-500 hover:border-[#1a3a6e] hover:text-[#1a3a6e] transition"
              >
                <RefreshOutlinedIcon style={{ fontSize: 20 }} />
              </button>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-gray-200" />

            {/* Secondary Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => exportVoters(voters)}
                disabled={voters.length === 0}
                className="flex items-center gap-2 border border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition disabled:opacity-40"
              >
                <FileDownloadOutlinedIcon style={{ fontSize: 16 }} />
                Export
              </button>

              <button
                onClick={() => setBulkOpen(true)}
                className="flex items-center gap-2 border border-[#1a3a6e] text-[#1a3a6e] hover:bg-[#1a3a6e] hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition"
              >
                <UploadFileOutlinedIcon style={{ fontSize: 16 }} />
                Bulk Upload
              </button>
            </div>

            {/* Primary Action */}
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 bg-[#1a3a6e] hover:bg-[#c8a84b] text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-md shadow-md transition"
            >
              <PersonAddOutlinedIcon style={{ fontSize: 17 }} />
              Add Voter
            </button>

            {/* Danger Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setResetAllOpen(true)}
                disabled={voters.length === 0}
                className="flex items-center gap-2 border border-yellow-400 text-yellow-600 hover:bg-yellow-50 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition disabled:opacity-40"
              >
                <RestartAltIcon style={{ fontSize: 16 }} />
                Reset Votes
              </button>

              <button
                onClick={() => setDeleteAllOpen(true)}
                disabled={voters.length === 0}
                className="flex items-center gap-2 border border-red-400 text-red-600 hover:bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition disabled:opacity-40"
              >
                <DeleteSweepOutlinedIcon style={{ fontSize: 16 }} />
                Delete All
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Stat
            icon={<PeopleOutlineOutlinedIcon style={{ fontSize: 22 }} />}
            label="Total Voters"
            value={loading ? "—" : voters.length}
            accent="#1a3a6e"
          />
          <Stat
            icon={<HowToVoteOutlinedIcon style={{ fontSize: 22 }} />}
            label="Voted"
            value={loading ? "—" : votedCount}
            accent="#16a34a"
          />
          <Stat
            icon={<RemoveCircleOutlineOutlinedIcon style={{ fontSize: 22 }} />}
            label="Pending"
            value={loading ? "—" : pendingCount}
            accent="#c8a84b"
          />
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <p className="text-[#1a3a6e] font-black text-sm uppercase tracking-wide">
              Registered Voters
              {search && !loading && (
                <span className="ml-2 text-gray-400 font-normal normal-case text-xs">
                  — {voters.length} result{voters.length !== 1 ? "s" : ""} for "
                  {search}"
                </span>
              )}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest w-12">
                    #
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Student ID
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Has Voted
                  </th>
                  <th className="text-right px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <SkeletonRows />
                ) : voters.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-16 text-gray-300 text-sm"
                    >
                      {search
                        ? `No voters match "${search}".`
                        : "No voters registered yet."}
                    </td>
                  </tr>
                ) : (
                  voters.map((voter, i) => (
                    <tr
                      key={voter._id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      <td className="px-6 py-3.5 text-gray-300 text-xs">
                        {i + 1}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {voter.studentId}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-700 font-medium">
                        {voter.name}
                      </td>
                      <td className="px-6 py-3.5">
                        {voter.hasVoted ? (
                          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 border border-green-200 text-[10px] font-black uppercase tracking-widest px-2.5 py-1">
                            <CheckCircleOutlineOutlinedIcon
                              style={{ fontSize: 13 }}
                            />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-black uppercase tracking-widest px-2.5 py-1">
                            <RemoveCircleOutlineOutlinedIcon
                              style={{ fontSize: 13 }}
                            />
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => setDeleteTarget(voter)}
                          className="p-1.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <DeleteOutlineOutlinedIcon style={{ fontSize: 18 }} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && voters.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <p className="text-gray-400 text-xs">
                Showing{" "}
                <span className="font-bold text-gray-600">{voters.length}</span>{" "}
                voter{voters.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />{" "}
                  Voted: {votedCount}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{" "}
                  Pending: {pendingCount}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ADD VOTER MODAL ── */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && setAddOpen(false)}
        >
          <div className="bg-white w-full max-w-sm shadow-2xl">
            <div className="bg-[#1a3a6e] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PersonAddOutlinedIcon
                  style={{ fontSize: 18 }}
                  className="text-[#c8a84b]"
                />
                <span className="text-white font-black text-sm uppercase tracking-widest">
                  Add Voter
                </span>
              </div>
              <button
                onClick={() => setAddOpen(false)}
                className="text-white/40 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#1a3a6e] uppercase tracking-widest">
                  Student ID
                </label>
                <input
                  value={newId}
                  onChange={(e) => {
                    setNewId(e.target.value);
                    setAddErrors((p) => ({ ...p, id: "" }));
                  }}
                  placeholder="e.g. JHS011"
                  className={`border-2 outline-none px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 transition-colors ${addErrors.id ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#1a3a6e]"}`}
                />
                {addErrors.id && (
                  <p className="text-red-500 text-xs">{addErrors.id}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#1a3a6e] uppercase tracking-widest">
                  Full Name
                </label>
                <input
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setAddErrors((p) => ({ ...p, name: "" }));
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="e.g. Kofi Acheampong"
                  className={`border-2 outline-none px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 transition-colors ${addErrors.name ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#1a3a6e]"}`}
                />
                {addErrors.name && (
                  <p className="text-red-500 text-xs">{addErrors.name}</p>
                )}
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setAddOpen(false)}
                  className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-400 font-bold text-xs uppercase tracking-widest py-3 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={addLoading}
                  className="flex-1 bg-[#1a3a6e] hover:bg-[#c8a84b] disabled:opacity-60 text-white font-black text-xs uppercase tracking-widest py-3 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {addLoading ? <SpinnerSvg /> : "Add →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BULK UPLOAD MODAL ── */}
      {bulkOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && setBulkOpen(false)}
        >
          <div className="bg-white w-full max-w-lg shadow-2xl">
            <div className="bg-[#1a3a6e] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UploadFileOutlinedIcon
                  style={{ fontSize: 18 }}
                  className="text-[#c8a84b]"
                />
                <span className="text-white font-black text-sm uppercase tracking-widest">
                  Bulk Upload Voters
                </span>
              </div>
              <button
                onClick={() => {
                  setBulkOpen(false);
                  setBulkPreview([]);
                  setBulkFileName("");
                  setBulkError("");
                }}
                className="text-white/40 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-6 flex flex-col gap-5">
              <div className="bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-600 leading-relaxed">
                Upload a <strong>.xlsx</strong> or <strong>.csv</strong> with
                columns <code className="bg-blue-100 px-1 rounded">id</code> and{" "}
                <code className="bg-blue-100 px-1 rounded">Name</code>.
                Duplicates are skipped automatically.
              </div>

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-[#1a3a6e] transition-colors cursor-pointer flex flex-col items-center py-8 gap-2 group"
              >
                <UploadFileOutlinedIcon
                  style={{ fontSize: 36 }}
                  className="text-gray-300 group-hover:text-[#1a3a6e] transition-colors"
                />
                {bulkFileName ? (
                  <p className="text-[#1a3a6e] font-bold text-sm">
                    {bulkFileName}
                  </p>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm font-semibold">
                      Click to select file
                    </p>
                    <p className="text-gray-300 text-xs">.xlsx or .csv only</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFile}
                  className="hidden"
                />
              </div>

              {bulkError && (
                <p className="text-red-500 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {bulkError}
                </p>
              )}

              {bulkPreview.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Preview — {bulkPreview.length} row
                    {bulkPreview.length !== 1 ? "s" : ""} found
                  </p>
                  <div className="border border-gray-100 overflow-auto max-h-48">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-2 text-gray-400 font-black uppercase tracking-widest">
                            ID
                          </th>
                          <th className="text-left px-4 py-2 text-gray-400 font-black uppercase tracking-widest">
                            Name
                          </th>
                          <th className="px-4 py-2 text-gray-400 font-black uppercase tracking-widest text-right">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {bulkPreview.map((r) => {
                          const isDup = voters.some(
                            (v) => v.studentId === r.studentId,
                          );
                          return (
                            <tr
                              key={r.studentId}
                              className={isDup ? "opacity-40" : ""}
                            >
                              <td className="px-4 py-2 font-mono text-gray-600">
                                {r.studentId}
                              </td>
                              <td className="px-4 py-2 text-gray-700">
                                {r.name}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {isDup ? (
                                  <span className="text-amber-500 font-bold">
                                    Duplicate
                                  </span>
                                ) : (
                                  <span className="text-green-500 font-bold">
                                    New
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setBulkOpen(false);
                    setBulkPreview([]);
                    setBulkFileName("");
                    setBulkError("");
                  }}
                  className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-400 font-bold text-xs uppercase tracking-widest py-3 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={!bulkPreview.length || bulkLoading}
                  className="flex-1 bg-[#1a3a6e] hover:bg-[#c8a84b] disabled:opacity-40 text-white font-black text-xs uppercase tracking-widest py-3 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {bulkLoading ? (
                    <SpinnerSvg />
                  ) : (
                    `Import ${newCount} Voter${newCount !== 1 ? "s" : ""}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE SINGLE MODAL ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}
        >
          <div className="bg-white w-full max-w-sm shadow-2xl">
            <div className="bg-red-500 px-6 py-4 flex items-center gap-2">
              <DeleteOutlineOutlinedIcon
                style={{ fontSize: 20 }}
                className="text-white"
              />
              <span className="text-white font-black text-sm uppercase tracking-widest">
                Remove Voter
              </span>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-500 text-sm mb-1">
                Are you sure you want to remove:
              </p>
              <p className="text-[#1a3a6e] font-black text-base">
                {deleteTarget.name}
              </p>
              <p className="text-gray-400 text-xs font-mono mb-6">
                {deleteTarget.studentId}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-400 font-bold text-xs uppercase tracking-widest py-3 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={doDelete}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-black text-xs uppercase tracking-widest py-3 transition-all flex items-center justify-center gap-2"
                >
                  {deleteLoading ? <SpinnerSvg /> : "Yes, Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE ALL MODAL ── */}
      {deleteAllOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) =>
            e.target === e.currentTarget && setDeleteAllOpen(false)
          }
        >
          <div className="bg-white w-full max-w-sm shadow-2xl">
            <div className="bg-red-600 px-6 py-4 flex items-center gap-2">
              <DeleteSweepOutlinedIcon
                style={{ fontSize: 20 }}
                className="text-white"
              />
              <span className="text-white font-black text-sm uppercase tracking-widest">
                Delete All Voters
              </span>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-600 text-sm mb-2">
                This will permanently remove all{" "}
                <span className="font-black text-red-500">
                  {voters.length} voters
                </span>
                . This cannot be undone.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeleteAllOpen(false)}
                  className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-400 font-bold text-xs uppercase tracking-widest py-3 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={doDeleteAll}
                  disabled={deleteAllLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-black text-xs uppercase tracking-widest py-3 transition-all flex items-center justify-center gap-2"
                >
                  {deleteAllLoading ? <SpinnerSvg /> : "Delete All"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET ALL MODAL ── */}
      {resetAllOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) =>
            e.target === e.currentTarget && setResetAllOpen(false)
          }
        >
          <div className="bg-white w-full max-w-sm shadow-2xl">
            <div className="bg-yellow-600 px-6 py-4 flex items-center gap-2">
              <RefreshOutlinedIcon
                style={{ fontSize: 20 }}
                className="text-white"
              />
              <span className="text-white font-black text-sm uppercase tracking-widest">
                Reset All Voters
              </span>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-600 text-sm mb-2">
                This will reset all voters to "not voted". This cannot be
                undone.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setResetAllOpen(false)}
                  className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-400 font-bold text-xs uppercase tracking-widest py-3 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={doResetAll}
                  disabled={resetAllLoading}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-60 text-white font-black text-xs uppercase tracking-widest py-3 transition-all flex items-center justify-center gap-2"
                >
                  {resetAllLoading ? <SpinnerSvg /> : "Reset All"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
};

export default Voters;
