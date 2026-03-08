import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import Welcome from "./pages/Welcome";
import VoteLogin from "./pages/VoteLogin";
import VoteSuccess from "./pages/VoteSuccess";
import Vote from "./pages/Vote";
import Login from "./pages/Login";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import Voters from "./pages/Voters";
import Candidates from "./pages/Candidates";
import Results from "./pages/Results";
import Profile from "./pages/Profile";
import LiveVoting from "./pages/LiveVoting";
import RootLayout from "./layout/RootLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import VotingProtectedRoute from "./components/VotingProtectedRoute";
import OtpManager from "./pages/OtpManager";

const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* Public routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="login" element={<Login />} />

        {/* Voting routes — protected by passcode */}
        <Route element={<VotingProtectedRoute />}>
          <Route path="vote-login" element={<VoteLogin />} />
          <Route path="vote" element={<Vote />} />
          <Route path="vote-success" element={<VoteSuccess />} />
        </Route>

        {/* Protected admin routes — ProtectedRoute checks for token */}
        <Route element={<ProtectedRoute />}>
          <Route path="admin" element={<RootLayout />}>
            <Route path="insights" element={<Insights />} />
            <Route path="settings" element={<Settings />} />
            <Route path="voters" element={<Voters />} />
            <Route path="candidates" element={<Candidates />} />
            <Route path="live-voting" element={<LiveVoting />} />
            <Route path="profile" element={<Profile />} />
            <Route path="results" element={<Results />} />
            <Route path="otp" element={<OtpManager />} />
          </Route>
        </Route>
      </>,
    ),
  );

  return <RouterProvider router={router} />;
};

export default App;
