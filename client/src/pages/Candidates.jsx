import { useState, useEffect, useRef, useCallback } from "react";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import * as XLSX from "xlsx";

const API = "http://localhost:3000/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

// ── Export candidates to Excel with percentage ──
const exportCandidates = (candidates) => {
  // Group by position to calculate percentages
  const byPosition = candidates.reduce((acc, c) => {
    if (!acc[c.position]) acc[c.position] = [];
    acc[c.position].push(c);
    return acc;
  }, {});

  const rows = candidates.map((c, i) => {
    const positionCandidates = byPosition[c.position] || [];
    const positionTotal = positionCandidates.reduce(
      (s, pc) => s + (pc.voteCount || 0),
      0,
    );
    const percentage =
      positionTotal > 0
        ? (((c.voteCount || 0) / positionTotal) * 100).toFixed(1)
        : "0.0";

    return {
      "#": i + 1,
      Name: c.name,
      Position: c.position,
      Votes: c.voteCount ?? 0,
      "% in Position": percentage + "%",
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 5 },
    { wch: 28 },
    { wch: 24 },
    { wch: 10 },
    { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Candidates");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `candidates_${date}.xlsx`);
};

// ── Toast ──
const Toast = ({ toast }) => {
  if (!toast.message) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 shadow-xl text-sm font-semibold border ${
        toast.type === "error"
          ? "bg-red-50 border-red-200 text-red-700"
          : "bg-green-50 border-green-200 text-green-700"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}
      />
      {toast.message}
    </div>
  );
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
      <p className="text-[#0a6b1b] text-xl font-black">{value}</p>
    </div>
  </div>
);

// ── Avatar ──
const Avatar = ({ src, name, size = "md" }) => {
  const [err, setErr] = useState(false);
  const initials = name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sizeClass = size === "lg" ? "w-20 h-20 text-xl" : "w-10 h-10 text-sm";

  if (!src || err) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-[#0a6b1b] text-white font-black flex items-center justify-center shrink-0`}
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

// ── Image picker ──
const ImagePicker = ({ preview, onChange }) => {
  const ref = useRef(null);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-[#0a6b1b] uppercase tracking-widest">
        Photo
      </label>
      <div
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-gray-200 hover:border-[#0a6b1b] transition-colors cursor-pointer flex items-center justify-center gap-3 py-4 group"
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            className="h-16 w-16 rounded-full object-cover border-2 border-[#0a6b1b]/20"
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <AddPhotoAlternateOutlinedIcon
              style={{ fontSize: 28 }}
              className="text-gray-300 group-hover:text-[#0a6b1b] transition-colors"
            />
            <p className="text-gray-400 text-xs">Click to upload image</p>
            <p className="text-gray-300 text-[10px]">
              JPEG, PNG, WEBP · max 5MB
            </p>
          </div>
        )}
        <input
          ref={ref}
          type="file"
          name="profilePicture"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files[0]) onChange(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>
      {preview && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-red-400 hover:text-red-600 text-xs text-center transition-colors"
        >
          Remove photo
        </button>
      )}
    </div>
  );
};

// ── Spinner ──
const Spinner = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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

const EMPTY_FORM = { name: "", position: "" };

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterPos, setFilterPos] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3500);
  };

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const query = filterPos
        ? `?position=${encodeURIComponent(filterPos)}`
        : "";
      const res = await fetch(`${API}/candidates${query}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCandidates(data);
    } catch (err) {
      showToast(err.message || "Failed to load candidates.", "error");
    } finally {
      setLoading(false);
    }
  }, [filterPos]);

  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/settings`, { headers: authHeaders() });
      const data = await res.json();
      console.log(data);
      if (res.ok) setPositions(data.positions || []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
    fetchPositions();
  }, [fetchCandidates, fetchPositions]);

  // Calculate percentages per position
  const candidatesWithPercentage = candidates.map((c) => {
    const positionCandidates = candidates.filter(
      (pc) => pc.position === c.position,
    );
    const positionTotal = positionCandidates.reduce(
      (s, pc) => s + (pc.voteCount || 0),
      0,
    );
    const percentage =
      positionTotal > 0 ? ((c.voteCount || 0) / positionTotal) * 100 : 0;
    return { ...c, percentage };
  });

  const filtered = candidatesWithPercentage.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.position.toLowerCase().includes(search.toLowerCase()),
  );
  const positionGroups = [...new Set(candidates.map((c) => c.position))];
  const totalVotes = candidates.reduce((s, c) => s + (c.voteCount || 0), 0);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditTarget(c);
    setForm({ name: c.name, position: c.position });
    setImageFile(null);
    setImagePreview(c.profilePicture || "");
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setFormErrors({});
  };

  const handleImageChange = (file) => {
    setImageFile(file);
    setImagePreview(
      file ? URL.createObjectURL(file) : editTarget?.profilePicture || "",
    );
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.position.trim()) e.position = "Position is required.";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setFormErrors(e);
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("position", form.position.trim());
      if (imageFile) fd.append("profilePicture", imageFile);

      const url = editTarget
        ? `${API}/candidates/${editTarget._id}`
        : `${API}/candidates`;
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast(data.message);
      closeModal();
      fetchCandidates();
    } catch (err) {
      showToast(err.message || "Failed to save candidate.", "error");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API}/candidates/${deleteTarget._id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCandidates((p) => p.filter((c) => c._id !== deleteTarget._id));
      showToast("Candidate removed.");
    } catch (err) {
      showToast(err.message || "Failed to delete.", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const doDeleteAll = async () => {
    setDeleteAllLoading(true);
    try {
      const res = await fetch(`${API}/candidates`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCandidates([]);
      showToast(data.message);
    } catch (err) {
      showToast(err.message || "Failed to delete all.", "error");
    } finally {
      setDeleteAllLoading(false);
      setDeleteAllOpen(false);
    }
  };

  const SkeletonRows = () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-50">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
              <div className="w-32 h-3 bg-gray-100 rounded animate-pulse" />
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="w-28 h-5 bg-gray-100 rounded animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="w-12 h-5 bg-gray-100 rounded animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="w-16 h-5 bg-gray-100 rounded animate-pulse" />
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
              className="text-[#0a6b1b] font-black uppercase text-2xl md:text-3xl"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Candidates
            </h1>

            <p className="text-gray-400 text-sm mt-1">
              Manage election candidates and positions.
            </p>
          </div>

          {/* ───── Right: Actions Section ───── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search + Filter + Refresh Group */}
            <div className="flex items-center gap-2">
              {/* Search */}
              {searchOpen ? (
                <div className="flex items-center border border-gray-300 bg-white rounded-md shadow-sm">
                  <span className="pl-3 text-gray-400">
                    <SearchOutlinedIcon style={{ fontSize: 18 }} />
                  </span>
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or position…"
                    className="w-52 outline-none px-3 py-2 text-sm text-gray-700 placeholder-gray-300 bg-transparent"
                  />
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      setSearch("");
                    }}
                    className="pr-3 text-gray-400 hover:text-[#0a6b1b]"
                  >
                    <CloseOutlinedIcon style={{ fontSize: 16 }} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2.5 border border-gray-300 rounded-md text-gray-500 hover:border-[#0a6b1b] hover:text-[#0a6b1b] transition"
                >
                  <SearchOutlinedIcon style={{ fontSize: 20 }} />
                </button>
              )}

              {/* Position Filter */}
              <div className="flex items-center border border-gray-300 rounded-md bg-white hover:border-[#0a6b1b] transition">
                <span className="pl-3 text-gray-400">
                  <FilterListOutlinedIcon style={{ fontSize: 18 }} />
                </span>
                <select
                  value={filterPos}
                  onChange={(e) => setFilterPos(e.target.value)}
                  className="outline-none px-3 py-2 text-sm text-gray-600 bg-transparent cursor-pointer pr-6"
                >
                  <option value="">All Positions</option>
                  {positions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refresh */}
              <button
                onClick={() => fetchCandidates()}
                title="Refresh"
                className="p-2.5 border border-gray-300 rounded-md text-gray-500 hover:border-[#0a6b1b] hover:text-[#0a6b1b] transition"
              >
                <RefreshOutlinedIcon style={{ fontSize: 20 }} />
              </button>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-gray-200" />

            {/* Secondary Actions */}
            <button
              onClick={() => exportCandidates(candidates)}
              disabled={candidates.length === 0}
              className="flex items-center gap-2 border border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition disabled:opacity-40"
            >
              <FileDownloadOutlinedIcon style={{ fontSize: 16 }} />
              Export
            </button>

            {/* Primary Action */}
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-[#0a6b1b] hover:bg-[#c8a84b] text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-md shadow-md transition"
            >
              <PersonAddOutlinedIcon style={{ fontSize: 17 }} />
              Add Candidate
            </button>

            {/* Danger Action */}
            <button
              onClick={() => setDeleteAllOpen(true)}
              disabled={candidates.length === 0}
              className="flex items-center gap-2 border border-red-400 text-red-600 hover:bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition disabled:opacity-40"
            >
              <DeleteSweepOutlinedIcon style={{ fontSize: 16 }} />
              Delete All
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Stat
            icon={<PeopleOutlineOutlinedIcon style={{ fontSize: 22 }} />}
            label="Total Candidates"
            value={loading ? "—" : candidates.length}
            accent="#0a6b1b"
          />
          <Stat
            icon={<WorkOutlineOutlinedIcon style={{ fontSize: 22 }} />}
            label="Positions Filled"
            value={loading ? "—" : positionGroups.length}
            accent="#c8a84b"
          />
          <Stat
            icon={<HowToVoteOutlinedIcon style={{ fontSize: 22 }} />}
            label="Total Votes Cast"
            value={loading ? "—" : totalVotes}
            accent="#16a34a"
          />
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <p className="text-[#0a6b1b] font-black text-sm uppercase tracking-wide">
              Registered Candidates
              {(search || filterPos) && !loading && (
                <span className="ml-2 text-gray-400 font-normal normal-case text-xs">
                  — {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Candidate
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Position
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Votes
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    % in Position
                  </th>
                  <th className="text-right px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <SkeletonRows />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-16 text-gray-300 text-sm"
                    >
                      {search || filterPos
                        ? "No candidates match your filters."
                        : "No candidates added yet."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr
                      key={c._id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar src={c.profilePicture} name={c.name} />
                          <span className="font-semibold text-gray-700">
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className="inline-flex items-center text-[#0a6b1b] text-[10px] font-black uppercase tracking-widest px-2.5 py-1"
                          style={{ background: "rgba(26,58,110,0.08)" }}
                        >
                          {c.position}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-black text-[#0a6b1b] text-sm">
                          {c.voteCount ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-600 text-sm">
                            {c.percentage.toFixed(1)}%
                          </span>
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0a6b1b] rounded-full transition-all"
                              style={{ width: `${c.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(c)}
                            className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-[#0a6b1b] transition-colors"
                          >
                            <EditOutlinedIcon style={{ fontSize: 17 }} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <DeleteOutlineOutlinedIcon
                              style={{ fontSize: 17 }}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-gray-400 text-xs">
                Showing{" "}
                <span className="font-bold text-gray-600">
                  {filtered.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-gray-600">
                  {candidates.length}
                </span>{" "}
                candidates
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-[#0a6b1b] px-6 py-5 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <PersonAddOutlinedIcon
                  style={{ fontSize: 18 }}
                  className="text-[#c8a84b]"
                />
                <span className="text-white font-black text-sm uppercase tracking-widest">
                  {editTarget ? "Edit Candidate" : "Add Candidate"}
                </span>
              </div>
              <button
                onClick={closeModal}
                className="text-white/40 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-6 flex flex-col gap-5">
              <ImagePicker
                preview={imagePreview}
                onChange={handleImageChange}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#0a6b1b] uppercase tracking-widest">
                  Full Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: e.target.value }));
                    setFormErrors((p) => ({ ...p, name: "" }));
                  }}
                  placeholder="e.g. Kwame Asante"
                  className={`border-2 outline-none px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 transition-colors ${formErrors.name ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#0a6b1b]"}`}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs">{formErrors.name}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#0a6b1b] uppercase tracking-widest">
                  Position
                </label>
                {positions.length > 0 ? (
                  <select
                    value={form.position}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, position: e.target.value }));
                      setFormErrors((p) => ({ ...p, position: "" }));
                    }}
                    className={`border-2 outline-none px-4 py-2.5 text-sm text-gray-700 bg-white transition-colors ${formErrors.position ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#0a6b1b]"}`}
                  >
                    <option value="">Select a position…</option>
                    {positions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={form.position}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, position: e.target.value }));
                      setFormErrors((p) => ({ ...p, position: "" }));
                    }}
                    placeholder="e.g. School Prefect"
                    className={`border-2 outline-none px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 transition-colors ${formErrors.position ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#0a6b1b]"}`}
                  />
                )}
                {formErrors.position && (
                  <p className="text-red-500 text-xs">{formErrors.position}</p>
                )}
                {positions.length === 0 && (
                  <p className="text-amber-500 text-[10px]">
                    No positions in Settings yet — you can type one manually.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-400 font-bold text-xs uppercase tracking-widest py-3 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-[#0a6b1b] hover:bg-[#c8a84b] disabled:opacity-60 text-white font-black text-xs uppercase tracking-widest py-3 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Spinner />
                  ) : (
                    <SaveOutlinedIcon style={{ fontSize: 16 }} />
                  )}
                  {saving
                    ? "Saving…"
                    : editTarget
                      ? "Save Changes"
                      : "Add Candidate"}
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
                Remove Candidate
              </span>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-center gap-4 mb-5">
                <Avatar
                  src={deleteTarget.profilePicture}
                  name={deleteTarget.name}
                  size="lg"
                />
                <div>
                  <p className="text-[#0a6b1b] font-black text-base">
                    {deleteTarget.name}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {deleteTarget.position}
                  </p>
                  {deleteTarget.voteCount > 0 && (
                    <p className="text-amber-500 text-xs mt-1 font-semibold">
                      ⚠ This candidate has {deleteTarget.voteCount} vote
                      {deleteTarget.voteCount !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-5">
                This will also delete their photo from storage. Cannot be
                undone.
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
                  {deleteLoading ? <Spinner /> : "Yes, Remove"}
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
                Delete All Candidates
              </span>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-600 text-sm mb-2">
                This will permanently delete all{" "}
                <span className="font-black text-red-500">
                  {candidates.length} candidates
                </span>{" "}
                and remove their photos from storage.
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
                  {deleteAllLoading ? <Spinner /> : "Delete All"}
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

export default Candidates;
