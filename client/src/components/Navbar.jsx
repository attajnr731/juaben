import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import BubbleChartOutlinedIcon from "@mui/icons-material/BubbleChartOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const API_BASE = "https://juaben.onrender.com/api";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

const navLinks = [
  {
    label: "Insight",
    to: "/admin/insights",
    icon: <BarChartOutlinedIcon style={{ fontSize: 17 }} />,
  },
  {
    label: "Candidates",
    to: "/admin/candidates",
    icon: <PeopleOutlineOutlinedIcon style={{ fontSize: 17 }} />,
  },
  {
    label: "Voters",
    to: "/admin/voters",
    icon: <HowToVoteOutlinedIcon style={{ fontSize: 17 }} />,
  },
  {
    label: "Results",
    to: "/admin/results",
    icon: <BubbleChartOutlinedIcon style={{ fontSize: 17 }} />,
  },
];

const Navbar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const profileRef = useRef(null);

  // ── Password modal for voting ──
  const [showPassModal, setShowPassModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Logout ──
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
      });
    } catch (err) {
      console.warn("Logout request failed:", err);
    } finally {
      localStorage.removeItem("adminToken");
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  // ── Open password modal ──
  const openVoteModal = () => {
    setShowPassModal(true);
    setPassword("");
    setPassError("");
    setShaking(false);
  };

  // ── Close password modal ──
  const closeVoteModal = () => {
    setShowPassModal(false);
    setPassword("");
    setPassError("");
    setShaking(false);
  };

  // ── Verify password against DB ──
  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setPassError("");

    try {
      // Fetch the voting passcode from settings
      const res = await fetch(`${API_BASE}/settings`, {
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok) throw new Error("Failed to fetch settings.");

      const correctPasscode = data.votingPasscode || "123456"; // fallback to default

      if (password === correctPasscode) {
        // Correct password → store in sessionStorage and navigate
        sessionStorage.setItem("votingAuthorized", "true");
        closeVoteModal();
        navigate("/vote-login");
      } else {
        // Wrong password → shake and show error
        setPassError("Incorrect passcode. Please try again.");
        setShaking(true);
        setPassword("");
        setTimeout(() => setShaking(false), 500);
      }
    } catch (err) {
      setPassError(err.message || "Server error. Please try again.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-10px); }
          40%       { transform: translateX(10px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
        .shake { animation: shake 0.45s ease; }
      `}</style>

      <header className="w-full h-16 bg-white border-b border-gray-100 shadow-sm flex items-center px-4 md:px-6 gap-4 z-40 sticky top-0">
        {/* ── LEFT: Hamburger + Brand ── */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-[#1a3a6e] transition-colors lg:hidden"
          >
            {mobileMenuOpen ? (
              <CloseOutlinedIcon style={{ fontSize: 22 }} />
            ) : (
              <MenuOutlinedIcon style={{ fontSize: 22 }} />
            )}
          </button>

          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="logo"
              className="h-9 w-9 object-contain"
            />
            <div className="hidden sm:block leading-tight">
              <p className="text-[#1a3a6e] font-black text-xs uppercase tracking-wide">
                Juaben <span className="text-[#c8a84b]">SHS</span>
              </p>
              <p className="text-gray-400 text-[9px] tracking-widest uppercase">
                Election Admin
              </p>
            </div>
          </div>

          <div className="hidden lg:block w-px h-6 bg-gray-200 ml-2" />
        </div>

        {/* ── DESKTOP NAV LINKS ── */}
        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {navLinks.map(({ label, to, icon }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 border-b-2 ${
                  isActive
                    ? "text-[#1a3a6e] border-[#1a3a6e] bg-[#1a3a6e]/5"
                    : "text-gray-400 border-transparent hover:text-[#1a3a6e] hover:bg-gray-50"
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}

          {/* Proceed to Vote button (triggers modal) */}
          <button
            onClick={openVoteModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 border-b-2 text-gray-400 border-transparent hover:text-[#1a3a6e] hover:bg-gray-50"
          >
            <HowToRegOutlinedIcon style={{ fontSize: 17 }} />
            Proceed to Vote
          </button>
        </nav>

        <div className="flex-1" />

        {/* ── PROFILE ── */}
        <div className="relative ml-1" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-[#1a3a6e] flex items-center justify-center text-white text-xs font-black uppercase shrink-0">
              JA
            </div>
            <div className="hidden md:block text-left leading-tight">
              <p className="text-gray-700 text-xs font-bold">
                Electoral Commission
              </p>
              <p className="text-gray-400 text-[10px]">Admin</p>
            </div>
            <KeyboardArrowDownIcon
              style={{ fontSize: 16 }}
              className={`text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 shadow-xl z-50">
              <ul className="py-1">
                {[
                  {
                    icon: (
                      <PersonOutlineOutlinedIcon style={{ fontSize: 16 }} />
                    ),
                    label: "My Profile",
                    to: "/admin/profile",
                  },
                  {
                    icon: <SettingsOutlinedIcon style={{ fontSize: 16 }} />,
                    label: "Settings",
                    to: "/admin/settings",
                  },
                ].map((item) => (
                  <li key={item.label}>
                    <NavLink
                      to={item.to}
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-500 hover:text-[#1a3a6e] hover:bg-gray-50 text-sm transition-colors"
                    >
                      <span className="text-gray-400">{item.icon}</span>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 text-sm transition-colors font-semibold disabled:opacity-50"
                >
                  {loggingOut ? (
                    <>
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
                      Signing out…
                    </>
                  ) : (
                    <>
                      <LogoutOutlinedIcon style={{ fontSize: 16 }} />
                      Sign Out
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── MOBILE NAV DRAWER ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-16 inset-x-0 bg-white border-b border-gray-100 shadow-lg z-30">
          <nav className="flex flex-col py-2">
            {navLinks.map(({ label, to, icon }) => (
              <NavLink
                key={label}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3.5 text-sm font-bold uppercase tracking-widest transition-colors border-l-4 ${
                    isActive
                      ? "text-[#1a3a6e] border-[#1a3a6e] bg-[#1a3a6e]/5"
                      : "text-gray-400 border-transparent hover:text-[#1a3a6e] hover:bg-gray-50"
                  }`
                }
              >
                {icon}
                {label}
              </NavLink>
            ))}

            {/* Proceed to Vote (mobile) */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openVoteModal();
              }}
              className="flex items-center gap-3 px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-[#1a3a6e] hover:bg-gray-50 transition-colors border-l-4 border-transparent"
            >
              <HowToRegOutlinedIcon style={{ fontSize: 17 }} />
              Proceed to Vote
            </button>

            {/* Mobile logout */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-3 px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-red-400 hover:bg-red-50 transition-colors border-l-4 border-transparent"
            >
              <LogoutOutlinedIcon style={{ fontSize: 17 }} />
              {loggingOut ? "Signing out…" : "Sign Out"}
            </button>
          </nav>
        </div>
      )}

      {/* ══════════════════════════════
          VOTING PASSWORD MODAL
      ══════════════════════════════ */}
      {showPassModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && closeVoteModal()}
        >
          <div
            className={`bg-white w-full max-w-sm shadow-2xl ${shaking ? "shake" : ""}`}
          >
            {/* Header */}
            <div className="bg-[#1a3a6e] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <LockOutlinedIcon
                  style={{ fontSize: 18 }}
                  className="text-[#c8a84b]"
                />
                <span className="text-white font-black text-sm uppercase tracking-widest">
                  Voting Access
                </span>
              </div>
              <button
                onClick={closeVoteModal}
                className="text-white/40 hover:text-white text-2xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                Enter the voting passcode to proceed to the student voting
                portal.
              </p>

              <form onSubmit={handleVoteSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#1a3a6e] text-[10px] font-black uppercase tracking-widest">
                    Passcode
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPassError("");
                    }}
                    placeholder="••••••"
                    autoFocus
                    disabled={verifying}
                    className={`w-full border-2 outline-none px-4 py-3 text-sm text-gray-700 transition-colors ${
                      passError
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 focus:border-[#1a3a6e]"
                    }`}
                  />
                  {passError && (
                    <p className="text-red-500 text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      {passError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeVoteModal}
                    disabled={verifying}
                    className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-400 hover:text-gray-600 font-bold text-xs uppercase tracking-widest py-3 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="flex-1 bg-[#1a3a6e] hover:bg-[#c8a84b] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-widest py-3 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {verifying ? (
                      <>
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
                        Verifying…
                      </>
                    ) : (
                      "Proceed →"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
