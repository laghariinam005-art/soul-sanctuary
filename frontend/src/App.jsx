import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import Topbar from "./components/Topbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Surveys from "./pages/Surveys";
import Data from "./pages/Data";
import Analytics from "./pages/Analytics";
import SocialMedia from "./pages/SocialMedia";

export default function App() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Topbar />
      <div className="container">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/surveys" element={<Surveys />} />
          <Route path="/data" element={<Data />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/social-media" element={<SocialMedia />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </>
  );
}
