import { useState } from "react";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";

const API_BASE = "https://juaben.onrender.com/api";

const PasswordInput = ({
  value,
  show,
  onToggle,
  onChange,
  placeholder,
  autoFocus,
}) => (
  <div className="flex items-center border-2 border-gray-200 focus-within:border-[#1a3a6e] bg-white transition-colors">
    <input
      autoFocus={autoFocus}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="flex-1 outline-none px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 bg-transparent"
    />
    <button
      type="button"
      onClick={onToggle}
      className="pr-3 text-gray-400 hover:text-[#1a3a6e] transition-colors"
    >
      {show ? (
        <VisibilityOffOutlinedIcon style={{ fontSize: 17 }} />
      ) : (
        <VisibilityOutlinedIcon style={{ fontSize: 17 }} />
      )}
    </button>
  </div>
);

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

// ── Generic editable field (name, email, phone) ───────────────────────────────
const EditableField = ({ icon, label, value, type = "text", onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    if (!draft.trim()) {
      setError(`${label} is required.`);
      return;
    }
    if (type === "email" && !/\S+@\S+\.\S+/.test(draft)) {
      setError("Enter a valid email.");
      return;
    }
    setLoading(true);
    setError("");
    const err = await onSave(draft);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(`${label} updated!`);
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setError("");
    setEditing(false);
  };

  return (
    <div className="py-5 flex items-start gap-4">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[#1a3a6e] text-[10px] font-black uppercase tracking-widest mb-2">
          {label}
        </p>
        {editing ? (
          <div className="flex items-center border-2 border-[#1a3a6e] bg-white">
            <input
              autoFocus
              type={type}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError("");
              }}
              className="flex-1 outline-none px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 bg-transparent"
            />
          </div>
        ) : (
          <p className="text-sm text-gray-700 truncate">
            {value || <span className="text-gray-300 italic">Not set</span>}
          </p>
        )}
        {error && (
          <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-600 text-xs mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            {success}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        {editing ? (
          <>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <CloseIcon style={{ fontSize: 17 }} />
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="p-2 rounded-lg bg-[#1a3a6e] text-white hover:bg-[#c8a84b] transition-colors disabled:opacity-50"
            >
              {loading ? <Spinner /> : <CheckIcon style={{ fontSize: 17 }} />}
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setEditing(true);
              setSuccess("");
            }}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#1a3a6e] transition-colors"
          >
            <EditOutlinedIcon style={{ fontSize: 17 }} />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Password field ────────────────────────────────────────────────────────────
const PasswordField = ({ onSave }) => {
  const [editing, setEditing] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    if (!oldPassword || !newPassword) {
      setError("Both fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    const err = await onSave(oldPassword, newPassword);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSuccess("Password updated!");
      setOldPassword("");
      setNewPassword("");
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleCancel = () => {
    setOldPassword("");
    setNewPassword("");
    setError("");
    setEditing(false);
  };

  return (
    <div className="py-5 flex items-start gap-4">
      <span className="text-gray-400 mt-0.5">
        <LockOutlinedIcon style={{ fontSize: 18 }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[#1a3a6e] text-[10px] font-black uppercase tracking-widest mb-2">
          Password
        </p>
        {editing ? (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1">
                Current Password
              </p>
              <PasswordInput
                autoFocus
                value={oldPassword}
                show={showOld}
                onToggle={() => setShowOld((v) => !v)}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
              />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1">
                New Password
              </p>
              <PasswordInput
                value={newPassword}
                show={showNew}
                onToggle={() => setShowNew((v) => !v)}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 tracking-widest">••••••••</p>
        )}
        {error && (
          <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-600 text-xs mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            {success}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        {editing ? (
          <>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <CloseIcon style={{ fontSize: 17 }} />
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="p-2 rounded-lg bg-[#1a3a6e] text-white hover:bg-[#c8a84b] transition-colors disabled:opacity-50"
            >
              {loading ? <Spinner /> : <CheckIcon style={{ fontSize: 17 }} />}
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setEditing(true);
              setSuccess("");
            }}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#1a3a6e] transition-colors"
          >
            <EditOutlinedIcon style={{ fontSize: 17 }} />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main Profile page ─────────────────────────────────────────────────────────
const Profile = () => {
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const token = localStorage.getItem("adminToken");
  const userId = adminData.id || adminData._id;

  const [profile, setProfile] = useState({
    name: adminData.name || "",
    email: adminData.email || "",
    phone: adminData.phone || "",
  });

  const initials =
    profile.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "A";

  const saveField = async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/auth/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) return data.message || "Update failed.";
      const updated = { ...adminData, ...data.user };
      localStorage.setItem("adminData", JSON.stringify(updated));
      setProfile((p) => ({ ...p, ...data.user }));
      return null;
    } catch {
      return "Could not reach the server.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="inline-flex items-center gap-2 bg-[#1a3a6e]/10 text-[#1a3a6e] px-4 py-1.5 rounded-full mb-6">
          <AdminPanelSettingsOutlinedIcon style={{ fontSize: 16 }} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Admin Profile
          </span>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="bg-[#1a3a6e] px-8 py-8 flex items-center gap-5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative z-10 w-16 h-16 rounded-full bg-[#c8a84b]/20 border-2 border-[#c8a84b]/40 flex items-center justify-center text-[#c8a84b] font-black text-xl shrink-0">
              {initials}
            </div>
            <div className="relative z-10">
              <h1
                className="text-white font-black text-xl uppercase leading-tight"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                {profile.name || "Admin"}
              </h1>
              <p className="text-white/50 text-sm">{profile.email}</p>
            </div>
          </div>

          <div className="px-8 py-2 divide-y divide-gray-50">
            <EditableField
              icon={<PersonOutlinedIcon style={{ fontSize: 18 }} />}
              label="Full Name"
              value={profile.name}
              type="text"
              onSave={(val) => saveField({ name: val })}
            />
            <EditableField
              icon={<EmailOutlinedIcon style={{ fontSize: 18 }} />}
              label="Email Address"
              value={profile.email}
              type="email"
              onSave={(val) => saveField({ email: val })}
            />
            <EditableField
              icon={<PhoneOutlinedIcon style={{ fontSize: 18 }} />}
              label="Phone Number"
              value={profile.phone}
              type="tel"
              onSave={(val) => saveField({ phone: val })}
            />
            <PasswordField
              onSave={(oldPassword, newPassword) =>
                saveField({ oldPassword, newPassword })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
