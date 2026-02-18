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
import RootLayout from "./layout/RootLayout";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* Public routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="vote-login" element={<VoteLogin />} />
        <Route path="login" element={<Login />} />
        <Route path="vote" element={<Vote />} />
        <Route path="vote-success" element={<VoteSuccess />} />

        {/* Protected admin routes — ProtectedRoute checks for token */}
        <Route element={<ProtectedRoute />}>
          <Route path="admin" element={<RootLayout />}>
            <Route path="insights" element={<Insights />} />
            <Route path="settings" element={<Settings />} />
            <Route path="voters" element={<Voters />} />
            <Route path="candidates" element={<Candidates />} />
          </Route>
        </Route>
      </>,
    ),
  );

  return <RouterProvider router={router} />;
};

export default App;
