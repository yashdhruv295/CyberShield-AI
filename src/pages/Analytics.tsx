import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Info } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { db } from "../firebase/firebase";
import { getLoggedUser } from "../services/scanHistory";

type ScanRecord = {
  id: string;
  type?: string;
  riskLevel?: string;
  riskScore?: number;
};

const RISK_LEVELS = [
  { name: "SAFE", color: "#25f4ae" },
  { name: "LOW RISK", color: "#4cc9f0" },
  { name: "SUSPICIOUS", color: "#ffb020" },
  { name: "HIGH RISK", color: "#ff4d6d" },
];

const SCAN_TYPES = ["URL", "EMAIL", "MESSAGE", "QR", "FILE"];

const tooltipStyle = {
  background: "#0b1324",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  color: "#ffffff",
};

export default function Analytics() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getLoggedUser();
    if (!user?.id) {
      navigate("/login");
      return;
    }

    const scansQuery = query(collection(db, "scans"), where("userId", "==", user.id));

    return onSnapshot(
      scansQuery,
      (snapshot) => {
        setScans(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })));
        setError("");
        setLoading(false);
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError("Unable to load analytics. Check your Firebase Firestore rules.");
        setLoading(false);
      }
    );
  }, [navigate]);

  const riskData = useMemo(
    () =>
      RISK_LEVELS.map((level) => ({
        ...level,
        value: scans.filter((scan) => String(scan.riskLevel || "").toUpperCase() === level.name)
          .length,
      })).filter((item) => item.value > 0),
    [scans]
  );

  const typeData = useMemo(
    () =>
      SCAN_TYPES.map((type) => ({
        type,
        scans: scans.filter((scan) => String(scan.type || "").toUpperCase() === type).length,
      })),
    [scans]
  );

  const total = scans.length;
  const threats = scans.filter((scan) =>
    ["SUSPICIOUS", "HIGH RISK"].includes(String(scan.riskLevel || "").toUpperCase())
  ).length;
  const averageRisk = total
    ? Math.round(scans.reduce((sum, scan) => sum + Number(scan.riskScore || 0), 0) / total)
    : 0;

  return (
    <main className="analytics-page">
      <header className="analytics-header">
        <div className="analytics-heading-icon">
          <BarChart3 size={34} />
        </div>
        <p>SECURITY ANALYTICS</p>
        <h1>Your Threat Overview</h1>
        <span>Insights from every scan you have saved in CyberShield AI.</span>
      </header>

      {error && <div className="dashboard-stats-error">{error}</div>}

      <section className="analytics-summary-grid">
        <div>
          <span>Total Scans</span>
          <strong>{loading ? "..." : total}</strong>
        </div>
        <div>
          <span>Threats Detected</span>
          <strong>{loading ? "..." : threats}</strong>
        </div>
        <div>
          <span>Average Risk Score</span>
          <strong>{loading ? "..." : `${averageRisk}/100`}</strong>
        </div>
      </section>

      <section className="analytics-grid">
        <article className="chart-card">
          <h2>Risk Distribution</h2>
          <p>How your scanned items were classified.</p>
          <div className="chart-area">
            {riskData.length === 0 ? (
              <p className="analytics-empty">No scans yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={105}
                    paddingAngle={3}
                  >
                    {riskData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="chart-card">
          <h2>Scans by Type</h2>
          <p>Which CyberShield tools you use most.</p>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="type" stroke="#8492a5" />
                <YAxis allowDecimals={false} stroke="#8492a5" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="scans" fill="#25f4ae" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <div className="analytics-note">
        <Info size={18} />
        Analytics update live as you run new scans while logged in.
      </div>
    </main>
  );
}
