import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

const API = "https://juaben.onrender.com/api";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

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

// ── Status pill ──
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

const OtpManager = () => {
  const [otpList, setOtpList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [lastOtps, setLastOtps] = useState([]);
  const [copiedId, setCopiedId] = useState(null); // tracks which OTP was copied
  const [status, setStatus] = useState({ status: "", message: "" });

  const showStatus = (s, m) => {
    setStatus({ status: s, message: m });
    setTimeout(() => setStatus({ status: "", message: "" }), 3000);
  };

  // ── Fetch OTP list ──
  const fetchOtps = useCallback(async () => {
    try {
      const res = await fetch(`${API}/settings/otps`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setOtpList(data.otps || []);
    } catch {
      showStatus("error", "Failed to load OTPs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOtps();
  }, [fetchOtps]);

  // ── Generate one OTP ──
  const generate = async () => {
    setGenerating(true);
    setLastOtps([]);
    try {
      const res = await fetch(`${API}/settings/otp/generate`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setLastOtps(data.codes); // array of 10 codes
      await fetchOtps();
    } catch (err) {
      showStatus("error", err.message || "Failed to generate OTPs.");
    } finally {
      setGenerating(false);
    }
  };

  // ── Clear used OTPs ──
  const clearUsed = async () => {
    setClearLoading(true);
    try {
      const res = await fetch(`${API}/settings/otps/used`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      await fetchOtps();

      setLastOtps([]);
      showStatus("success", "Used OTPs cleared.");
    } catch {
      showStatus("error", "Failed to clear used OTPs.");
    } finally {
      setClearLoading(false);
    }
  };

  // ── Export unused OTPs to Excel (10 per row, bordered) ──
  const exportToExcel = () => {
    const unused = [...otpList].reverse().filter((o) => !o.used).map((o) => o.code);
    const COLS = 10;
    const rows = [];
    for (let i = 0; i < unused.length; i += COLS) {
      rows.push(unused.slice(i, i + COLS));
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    const border = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };

    const totalRows = rows.length;
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < COLS; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) ws[addr] = { t: "z", v: "" };
        ws[addr].s = {
          border,
          font: { bold: true, name: "Courier New", sz: 13 },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    }

    ws["!cols"] = Array(COLS).fill({ wch: 12 });
    ws["!rows"] = Array(totalRows).fill({ hpt: 28 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "OTPs");
    XLSX.writeFile(wb, `OTPs_${new Date().toISOString().slice(0, 10)}.xlsx`, { cellStyles: true });
  };

  // ── Copy an OTP code ──
  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const unusedCount = otpList.filter((o) => !o.used).length;
  const usedCount = otpList.filter((o) => o.used).length;

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 py-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* ── Page Header ── */}
        <div className="border-b border-gray-100 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[#c8a84b] text-[10px] font-black uppercase tracking-widest mb-1">
              Admin Panel
            </p>
            <h1
              className="text-[#0a6b1b] font-black uppercase text-2xl md:text-3xl"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              OTP Manager
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Generate one-time passwords for voters to authenticate with their
              Student ID.
            </p>
          </div>

          {/* Stats chips */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white border border-gray-200 px-4 py-2 shadow-sm text-center">
              <p className="text-[#0a6b1b] font-black text-xl leading-none">
                {unusedCount}
              </p>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest mt-0.5">
                Unused
              </p>
            </div>
            <div className="bg-white border border-gray-200 px-4 py-2 shadow-sm text-center">
              <p className="text-gray-400 font-black text-xl leading-none">
                {usedCount}
              </p>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest mt-0.5">
                Used
              </p>
            </div>
          </div>
        </div>

        {/* ── Action Bar ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest bg-[#0a6b1b] hover:bg-[#c8a84b] disabled:opacity-60 text-white transition-all duration-300 shadow-sm"
          >
            {generating ? (
              <Spinner />
            ) : (
              <AddOutlinedIcon style={{ fontSize: 16 }} />
            )}
            {generating ? "Generating…" : "Generate OTP"}
          </button>

          <button
            onClick={fetchOtps}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest border border-gray-300 text-gray-500 hover:border-[#0a6b1b] hover:text-[#0a6b1b] disabled:opacity-50 transition-all"
          >
            <RefreshOutlinedIcon
              style={{ fontSize: 15 }}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            onClick={exportToExcel}
            disabled={unusedCount === 0}
            className="flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest border border-gray-300 text-gray-500 hover:border-[#0a6b1b] hover:text-[#0a6b1b] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <FileDownloadOutlinedIcon style={{ fontSize: 15 }} />
            Export OTPs ({unusedCount})
          </button>

          <div className="sm:ml-auto">
            <button
              onClick={clearUsed}
              disabled={clearLoading || usedCount === 0}
              className="flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest border border-red-200 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {clearLoading ? (
                <Spinner />
              ) : (
                <DeleteOutlineOutlinedIcon style={{ fontSize: 15 }} />
              )}
              Clear Used OTPs ({usedCount})
            </button>
          </div>
        </div>

        {/* Status pill */}
        {status.message && <StatusPill {...status} />}

        {/* ── Last Generated OTP Banner ── */}
        {lastOtps.length > 0 && (
          <div className="border-2 border-[#c8a84b] bg-amber-50 px-6 py-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-4">
              ✦ Newly Generated — Share with voters immediately
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {lastOtps.map((code) => (
                <div
                  key={code}
                  className="flex items-center justify-between border border-[#c8a84b] bg-white px-3 py-2"
                >
                  <span className="text-[#0a6b1b] font-black tracking-widest font-mono text-sm">
                    {code}
                  </span>
                  <button
                    onClick={() => copyCode(code, code)}
                    className="ml-2 text-gray-300 hover:text-[#0a6b1b] transition-colors"
                    title="Copy"
                  >
                    {copiedId === code ? (
                      <CheckOutlinedIcon
                        style={{ fontSize: 14 }}
                        className="text-green-500"
                      />
                    ) : (
                      <ContentCopyOutlinedIcon style={{ fontSize: 14 }} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── OTP Table ── */}
        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyOutlinedIcon
                style={{ fontSize: 16 }}
                className="text-[#0a6b1b]"
              />
              <p className="text-[#0a6b1b] font-black text-xs uppercase tracking-widest">
                All OTPs
              </p>
            </div>
            <p className="text-gray-400 text-xs">{otpList.length} total</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Spinner className="w-5 h-5 text-[#0a6b1b]" />
              <span className="text-sm">Loading OTPs…</span>
            </div>
          ) : otpList.length === 0 ? (
            <div className="py-16 text-center">
              <KeyOutlinedIcon
                style={{ fontSize: 32 }}
                className="text-gray-200 mb-3"
              />
              <p className="text-gray-300 text-sm">No OTPs generated yet.</p>
              <p className="text-gray-300 text-xs mt-1">
                Click "Generate OTP" to create the first one.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {/* Header row */}
              <div className="grid grid-cols-12 px-6 py-2 bg-gray-50 border-b border-gray-100">
                <span className="col-span-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  #
                </span>
                <span className="col-span-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Code
                </span>
                <span className="col-span-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Status
                </span>
                <span className="col-span-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Generated
                </span>
                <span className="col-span-1" />
              </div>

              {[...otpList].reverse().map((o, i) => (
                <div
                  key={o._id}
                  className={`grid grid-cols-12 items-center px-6 py-3.5 transition-colors ${
                    o.used
                      ? "bg-gray-50/60 hover:bg-gray-50"
                      : "hover:bg-green-50/30"
                  }`}
                >
                  {/* # */}
                  <span className="col-span-1 text-gray-300 text-xs font-mono">
                    {otpList.length - i}
                  </span>

                  {/* Code */}
                  <span
                    className={`col-span-4 font-mono font-black text-base tracking-[0.3em] ${
                      o.used ? "text-gray-300 line-through" : "text-[#0a6b1b]"
                    }`}
                  >
                    {o.code}
                  </span>

                  {/* Status badge */}
                  <span className="col-span-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 ${
                        o.used
                          ? "bg-gray-100 text-gray-400"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {o.used ? "Used" : "✦ Unused"}
                    </span>
                  </span>

                  {/* Date */}
                  <span className="col-span-3 text-gray-400 text-[10px]">
                    {new Date(o.createdAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {/* Copy button — only for unused */}
                  <span className="col-span-1 flex justify-end">
                    {!o.used && (
                      <button
                        onClick={() => copyCode(o.code, o._id)}
                        title="Copy OTP"
                        className="p-1.5 text-gray-300 hover:text-[#0a6b1b] hover:bg-green-50 transition-colors"
                      >
                        {copiedId === o._id ? (
                          <CheckOutlinedIcon
                            style={{ fontSize: 15 }}
                            className="text-green-500"
                          />
                        ) : (
                          <ContentCopyOutlinedIcon style={{ fontSize: 15 }} />
                        )}
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How-it-works note */}
        <div className="bg-white border border-gray-100 shadow-sm px-6 py-5">
          <p className="text-[#0a6b1b] font-black text-xs uppercase tracking-widest mb-3">
            How OTPs Work
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                text: "Generate an OTP for each voter before they approach the booth.",
              },
              {
                step: "02",
                text: "The voter enters their Student ID + the OTP on the login page.",
              },
              {
                step: "03",
                text: "The OTP expires immediately after use — it cannot be reused.",
              },
            ].map(({ step, text }) => (
              <div key={step} className="flex gap-3 items-start">
                <span className="text-[#c8a84b] font-black text-lg leading-none shrink-0">
                  {step}
                </span>
                <p className="text-gray-400 text-xs leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpManager;
