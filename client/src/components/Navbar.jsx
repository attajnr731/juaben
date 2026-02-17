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
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";

const API_BASE = "http://localhost:3000/api";

const navLinks = [
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
    label: "Insight",
    to: "/admin/insights",
    icon: <BarChartOutlinedIcon style={{ fontSize: 17 }} />,
  },
  {
    label: "History",
    to: "/admin/history",
    icon: <HistoryOutlinedIcon style={{ fontSize: 17 }} />,
  },
];

const Navbar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const profileRef = useRef(null);

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        credentials: "include",
      });
    } catch (err) {
      // Even if the request fails, clear locally and redirect
      console.warn("Logout request failed:", err);
    } finally {
      localStorage.removeItem("adminToken");
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
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
              <p className="text-gray-700 text-xs font-bold">Juaben Admin</p>
              <p className="text-gray-400 text-[10px]">Super Admin</p>
            </div>
            <KeyboardArrowDownIcon
              style={{ fontSize: 16 }}
              className={`text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 shadow-xl z-50">
              {/* user info */}
              <div className="px-4 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1a3a6e] flex items-center justify-center text-white text-sm font-black">
                    JA
                  </div>
                  <div>
                    <p className="text-gray-700 text-xs font-black">
                      Juaben Admin
                    </p>
                    <p className="text-gray-400 text-[10px]">
                      admin@juabenshs.edu.gh
                    </p>
                  </div>
                </div>
              </div>

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

              {/* Logout */}
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
    </>
  );
};

export default Navbar;
