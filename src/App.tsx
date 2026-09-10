import {
  HashRouter,
  Route,
  Routes,
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import UrlScanner from "./pages/UrlScanner";
import EmailScanner from "./pages/EmailScanner";
import MessageScanner from "./pages/MessageScanner";

import QrScanner from "./pages/QrScanner";
import FileScanner from "./pages/FileScanner";
import PasswordChecker from "./pages/PasswordChecker";

import Analytics from "./pages/Analytics";
import ScanHistory from "./pages/ScanHistory";

import CyberAssistant from "./pages/CyberAssistant";
import LearningCenter from "./pages/LearningCenter";

import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";

import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <HashRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/url-scanner"
          element={<UrlScanner />}
        />

        <Route
          path="/email-scanner"
          element={<EmailScanner />}
        />

        <Route
          path="/message-scanner"
          element={<MessageScanner />}
        />

        <Route
          path="/qr-scanner"
          element={<QrScanner />}
        />

        <Route
          path="/file-scanner"
          element={<FileScanner />}
        />

        <Route
          path="/password-checker"
          element={<PasswordChecker />}
        />

        <Route
          path="/analytics"
          element={<Analytics />}
        />

        <Route
          path="/history"
          element={<ScanHistory />}
        />

        <Route
          path="/assistant"
          element={<CyberAssistant />}
        />

        <Route
          path="/learning"
          element={<LearningCenter />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </HashRouter>
  );
}