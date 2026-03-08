import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const API_BASE = "http://localhost:3000/api";

const VotingProtectedRoute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if voting session exists
  useEffect(() => {
    const votingSession = sessionStorage.getItem("votingAuthorized");
    if (votingSession === "true") {
      setIsAuthorized(true);
      setLoading(false);
    } else {
      setShowModal(true);
      setLoading(false);
    }
  }, []);

  // Verify passcode
  const handleSubmit = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/settings`);
      const data = await res.json();

      if (!res.ok) throw new Error("Failed to fetch settings.");

      const correctPasscode = data.votingPasscode || "123456";

      if (password === correctPasscode) {
        // Success - store in sessionStorage (cleared when browser tab closes)
        sessionStorage.setItem("votingAuthorized", "true");
        setIsAuthorized(true);
        setShowModal(false);
      } else {
        setError("Incorrect passcode. Please try again.");
        setShaking(true);
        setPassword("");
        setTimeout(() => setShaking(false), 500);
      }
    } catch (err) {
      setError(err.message || "Server error. Please try again.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg
          className="w-8 h-8 animate-spin text-[#0a6b1b]"
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
      </div>
    );
  }

  if (!isAuthorized && showModal) {
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

        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md px-4">
          <div
            className={`bg-white w-full max-w-sm shadow-2xl ${shaking ? "shake" : ""}`}
          >
            {/* Header */}
            <div className="bg-[#0a6b1b] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <LockOutlinedIcon
                  style={{ fontSize: 18 }}
                  className="text-[#c8a84b]"
                />
                <span className="text-white font-black text-sm uppercase tracking-widest">
                  Voting Access Required
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                Enter the voting passcode to access the student voting portal.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#0a6b1b] text-[10px] font-black uppercase tracking-widest">
                    Passcode
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="••••••"
                    autoFocus
                    disabled={verifying}
                    className={`w-full border-2 outline-none px-4 py-3 text-sm text-gray-700 transition-colors ${
                      error
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 focus:border-[#0a6b1b]"
                    }`}
                  />
                  {error && (
                    <p className="text-red-500 text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      {error}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={verifying}
                    className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-400 hover:text-gray-600 font-bold text-xs uppercase tracking-widest py-3 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="flex-1 bg-[#0a6b1b] hover:bg-[#c8a84b] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-widest py-3 transition-all duration-300 flex items-center justify-center gap-2"
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
      </>
    );
  }

  return isAuthorized ? <Outlet /> : null;
};

export default VotingProtectedRoute;
