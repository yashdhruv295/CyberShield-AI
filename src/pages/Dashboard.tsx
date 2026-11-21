import {
  BarChart3,
  Bot,
  BookOpen,
  FileSearch,
  History,
  KeyRound,
  Link2,
  MailWarning,
  MessageSquareWarning,
  QrCode,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebase";

type LoggedUser = {
  id: string;
  name: string;
  mobile: string;
};

type Stats = {
  total: number;
  safe: number;
  suspicious: number;
  highRisk: number;
};

export default function Dashboard() {
  const navigate =
    useNavigate();

  const [user, setUser] =
    useState<LoggedUser | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [
    statistics,
    setStatistics,
  ] = useState<Stats>({
    total: 0,
    safe: 0,
    suspicious: 0,
    highRisk: 0,
  });

  const [
    statsError,
    setStatsError,
  ] = useState("");

  useEffect(() => {
    let currentUser:
      LoggedUser | null = null;

    try {
      const raw =
        localStorage.getItem(
          "cyberShieldUser"
        );

      currentUser =
        raw
          ? JSON.parse(raw)
          : null;
    } catch {
      currentUser =
        null;
    }

    if (
      !currentUser?.id
    ) {
      navigate(
        "/login"
      );
      return;
    }

    setUser(
      currentUser
    );

    const scansQuery =
      query(
        collection(
          db,
          "scans"
        ),
        where(
          "userId",
          "==",
          currentUser.id
        )
      );

    const unsubscribe =
      onSnapshot(
        scansQuery,
        (snapshot) => {
          let safe = 0;
          let suspicious = 0;
          let highRisk = 0;

          snapshot.docs.forEach(
            (document) => {
              const level =
                String(
                  document.data()
                    .riskLevel ||
                    ""
                ).toUpperCase();

              if (
                level ===
                  "SAFE" ||
                level ===
                  "LOW RISK"
              ) {
                safe += 1;
              } else if (
                level ===
                "SUSPICIOUS"
              ) {
                suspicious += 1;
              } else if (
                level ===
                "HIGH RISK"
              ) {
                highRisk += 1;
              }
            }
          );

          setStatistics({
            total:
              snapshot.size,
            safe,
            suspicious,
            highRisk,
          });

          setLoading(false);
          setStatsError("");
        },
        (error) => {
          console.error(
            error
          );

          setStatsError(
            "Unable to load scan statistics."
          );

          setLoading(false);
        }
      );

    return unsubscribe;
  }, [navigate]);

  const tools = [
    {
      title:
        "URL Scanner",
      description:
        "Check suspicious web links.",
      path:
        "/url-scanner",
      icon:
        <Link2 />,
    },

    {
      title:
        "Email Scanner",
      description:
        "Detect phishing emails.",
      path:
        "/email-scanner",
      icon:
        <MailWarning />,
    },

    {
      title:
        "Message Scanner",
      description:
        "Analyze SMS and WhatsApp scams.",
      path:
        "/message-scanner",
      icon:
        <MessageSquareWarning />,
    },

    {
      title:
        "QR Scanner",
      description:
        "Analyze QR code links.",
      path:
        "/qr-scanner",
      icon:
        <QrCode />,
    },

    {
      title:
        "File Scanner",
      description:
        "Check files for malware.",
      path:
        "/file-scanner",
      icon:
        <FileSearch />,
    },

    {
      title:
        "Password Checker",
      description:
        "Test password strength safely.",
      path:
        "/password-checker",
      icon:
        <KeyRound />,
    },

    {
      title:
        "Analytics",
      description:
        "View security charts.",
      path:
        "/analytics",
      icon:
        <BarChart3 />,
    },

    {
      title:
        "Scan History",
      description:
        "Review previous scans.",
      path:
        "/history",
      icon:
        <History />,
    },

    {
      title:
        "Cyber AI Assistant",
      description:
        "Ask security questions.",
      path:
        "/assistant",
      icon:
        <Bot />,
    },

    {
      title:
        "Learning Center",
      description:
        "Learn cyber safety.",
      path:
        "/learning",
      icon:
        <BookOpen />,
    },
  ];

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        <section className="dashboard-welcome">
          <div>
            <span className="dashboard-label">
              Security Dashboard
            </span>

            <h1>
              Welcome,
              {" "}
              {user?.name ||
                "User"}
            </h1>

            <p>
              Monitor your
              CyberShield AI
              security activity.
            </p>
          </div>

          <div className="dashboard-shield">
            <ShieldCheck
              size={50}
            />
          </div>
        </section>

        {statsError && (
          <div className="dashboard-stats-error">
            {statsError}
          </div>
        )}

        {loading && (
          <p className="dashboard-live-loading">
            Loading security
            statistics...
          </p>
        )}

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-icon">
              <ShieldCheck />
            </div>

            <span>
              Total Scans
            </span>

            <strong>
              {statistics.total}
            </strong>
          </article>

          <article className="stat-card safe-stat">
            <div className="stat-icon">
              <ShieldCheck />
            </div>

            <span>
              Safe
            </span>

            <strong>
              {statistics.safe}
            </strong>
          </article>

          <article className="stat-card suspicious-stat">
            <div className="stat-icon">
              <ShieldAlert />
            </div>

            <span>
              Suspicious
            </span>

            <strong>
              {
                statistics.suspicious
              }
            </strong>
          </article>

          <article className="stat-card danger-stat">
            <div className="stat-icon">
              <ShieldAlert />
            </div>

            <span>
              High Risk
            </span>

            <strong>
              {
                statistics.highRisk
              }
            </strong>
          </article>
        </section>

        <section className="dashboard-tools-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-label">
                Cyber Tools
              </span>

              <h2>
                Security Features
              </h2>
            </div>
          </div>

          <div className="tool-grid">
            {tools.map(
              (tool) => (
                <Link
                  key={
                    tool.path
                  }
                  to={
                    tool.path
                  }
                  className="tool-card"
                >
                  <div className="tool-icon">
                    {tool.icon}
                  </div>

                  <h3>
                    {
                      tool.title
                    }
                  </h3>

                  <p>
                    {
                      tool.description
                    }
                  </p>
                </Link>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}