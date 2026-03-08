import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const API_BASE = "http://localhost:3000/api";

const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Client-side validation ──
  const validate = () => {
    const errs = {};
    if (!email) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email.";
    if (!password) errs.password = "Password is required.";
    return errs;
  };

  // ── Submit → POST /api/auth/login ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // sends/receives cookies if your server uses them
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show the server's error message (e.g. "Invalid credentials")
        setServerError(data.message || "Login failed. Please try again.");
        return;
      }

      // ── Success ──
      // If your server returns a token, store it
      if (data.token) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminData", JSON.stringify(data.admin)); // { id, name, email }
      }

      // Redirect to dashboard
      navigate("/admin/insights");
    } catch (err) {
      console.error("Login error:", err);
      setServerError("Unable to reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex w-1/2 bg-[#0a6b1b] flex-col items-center justify-center px-16 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -right-16 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.03]" />

        <div className="relative z-10 flex flex-col items-center text-center gap-6">
          <img
            src="/logo.png"
            alt="Nursing SHS Logo"
            className="h-24 w-24 object-contain drop-shadow-xl"
          />

          <div>
            <h1
              className="text-white font-black uppercase text-4xl leading-tight"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              KETE-KRACHIE
            </h1>
            <h1
              className="font-black uppercase text-4xl leading-tight"
              style={{
                fontFamily: "'Georgia', serif",
                background: "linear-gradient(90deg, #b8860b, #c8a84b, #e8c86a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              NURSING & MIDWIFERY
            </h1>
          </div>

          <div className="w-12 h-px bg-[#c8a84b]" />

          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            Student Elections Portal · 2026. Manage candidates, monitor live
            results, and oversee a transparent democratic process.
          </p>

          <div className="flex gap-3 mt-4">
            {[
              { label: "Candidates", value: "12" },
              { label: "Voters", value: "840" },
              { label: "Positions", value: "6" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center bg-white/10 rounded px-5 py-3"
              >
                <span className="text-[#c8a84b] font-black text-xl">
                  {s.value}
                </span>
                <span className="text-white/50 text-[10px] uppercase tracking-widest">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-10">
          <img
            src="/logo.png"
            alt="logo"
            className="h-10 w-10 object-contain"
          />
          <div>
            <p className="text-[#0a6b1b] font-black text-sm uppercase tracking-wide leading-tight">
              KETE_KRACHIE NURSING & MIDWIFERY
            </p>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase">
              Student Elections
            </p>
          </div>
        </div>

        <div className="w-full max-w-md">
          {/* heading */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-[#0a6b1b]/10 text-[#0a6b1b] px-4 py-1.5 rounded-full mb-5">
              <AdminPanelSettingsOutlinedIcon style={{ fontSize: 16 }} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Admin Access
              </span>
            </div>
            <h2
              className="text-[#0a6b1b] font-black uppercase text-3xl leading-tight"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Welcome Back
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Sign in to manage the election portal.
            </p>
          </div>

          {/* ── Server error banner ── */}
          {serverError && (
            <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 px-4 py-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <p className="text-red-600 text-xs font-semibold">
                {serverError}
              </p>
              <button
                onClick={() => setServerError("")}
                className="ml-auto text-red-400 hover:text-red-600 transition-colors text-base leading-none"
              >
                ×
              </button>
            </div>
          )}

          {/* form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#0a6b1b] text-[10px] font-black uppercase tracking-widest">
                Email Address
              </label>
              <div
                className={`flex items-center border-2 transition-colors ${
                  errors.email
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 focus-within:border-[#0a6b1b] bg-white"
                }`}
              >
                <span className="pl-4 text-gray-400">
                  <EmailOutlinedIcon style={{ fontSize: 18 }} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((p) => ({ ...p, email: "" }));
                    setServerError("");
                  }}
                  placeholder="admin@nursing.edu.gh"
                  className="flex-1 bg-transparent outline-none px-3 py-3.5 text-sm text-gray-700 placeholder-gray-300"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[#0a6b1b] text-[10px] font-black uppercase tracking-widest">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[#c8a84b] hover:text-[#b8860b] text-xs font-semibold transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div
                className={`flex items-center border-2 transition-colors ${
                  errors.password
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 focus-within:border-[#0a6b1b] bg-white"
                }`}
              >
                <span className="pl-4 text-gray-400">
                  <LockOutlinedIcon style={{ fontSize: 18 }} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((p) => ({ ...p, password: "" }));
                    setServerError("");
                  }}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent outline-none px-3 py-3.5 text-sm text-gray-700 placeholder-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="pr-4 text-gray-400 hover:text-[#0a6b1b] transition-colors"
                >
                  {showPassword ? (
                    <VisibilityOffOutlinedIcon style={{ fontSize: 18 }} />
                  ) : (
                    <VisibilityOutlinedIcon style={{ fontSize: 18 }} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#0a6b1b] cursor-pointer"
              />
              <span className="text-gray-400 text-sm">Keep me signed in</span>
            </label>

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex items-center justify-center gap-2 bg-[#0a6b1b] hover:bg-[#c8a84b] disabled:opacity-60 text-white font-black text-sm uppercase tracking-widest py-4 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <svg
                  className="w-5 h-5 animate-spin"
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
                <>
                  <span>Sign In</span>
                  <ArrowForwardIcon
                    style={{ fontSize: 18 }}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-gray-300 text-xs uppercase tracking-widest">
              or
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <p className="text-center text-gray-400 text-xs">
            Not an admin?{" "}
            <a
              href="/"
              className="text-[#0a6b1b] font-bold hover:text-[#c8a84b] transition-colors"
            >
              Return to Welcome Page
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
