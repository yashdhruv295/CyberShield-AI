
import {
  AlertTriangle,
  LoaderCircle,
  ShieldCheck
} from "lucide-react";

import {
  FormEvent,
  useState
} from "react";

import type {
  AIAnalysisResult
} from "../services/aiScanner";

import {
  saveScan
} from "../services/scanHistory";

import {
  downloadSecurityReport
} from "../services/pdfReport";

import {
  useSessionState
} from "../hooks/useSessionState";

import {
  useTaskTracker
} from "../hooks/useTaskTracker";

import TaskProgress from "./TaskProgress";

type Props = {
  title: string;
  subtitle: string;
  placeholder: string;
  type: "EMAIL" | "MESSAGE";

  analyze: (
    content: string
  ) => Promise<AIAnalysisResult>;
};

export default function AITextScanner({
  title,
  subtitle,
  placeholder,
  type,
  analyze
}: Props) {
  const pageKey = type.toLowerCase();

  const [content, setContent] = useSessionState(
    `${pageKey}-scanner:content`,
    ""
  );

  const [error, setError] = useSessionState(
    `${pageKey}-scanner:error`,
    ""
  );

  const [saved, setSaved] = useSessionState(
    `${pageKey}-scanner:saved`,
    false
  );

  const [result, setResult] =
    useSessionState<AIAnalysisResult | null>(
      `${pageKey}-scanner:result`,
      null
    );

  const [loading, setLoading] = useState(false);

  const tracker = useTaskTracker(
    `${pageKey}-scanner`
  );

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setSaved(false);

    const cleanContent = content.trim();

    if (cleanContent.length < 5) {
      setError(
        "Please enter enough content for analysis."
      );
      return;
    }

    setLoading(true);

    tracker.start(
      "Sending content for AI analysis..."
    );

    try {
      const data = await analyze(cleanContent);

      setResult(data);

      tracker.finish(
        "AI analysis completed"
      );

      try {
        await saveScan({
          type,
          input: cleanContent.slice(0, 500),
          riskLevel: data.riskLevel,
          riskScore: data.riskScore,
          summary: data.summary,
          reasons: data.reasons,
          suspiciousElements: data.suspiciousElements,
          recommendation: data.recommendation
        });

        setSaved(true);
      } catch (saveError) {
        console.error(
          "History Save Error:",
          saveError
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Analysis failed.";

      setError(message);
      tracker.fail(message);
    } finally {
      setLoading(false);
    }
  };

  const riskClass = !result
    ? ""
    : result.riskLevel === "SAFE" ||
      result.riskLevel === "LOW RISK"
    ? "risk-safe"
    : result.riskLevel === "SUSPICIOUS"
    ? "risk-suspicious"
    : result.riskLevel === "HIGH RISK"
    ? "risk-danger"
    : "";

  return (
    <main className="scanner-page">
      <div className="scanner-container">

        <div className="scanner-header">
          <div className="scanner-icon">
            <ShieldCheck size={30} />
          </div>

          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>

        <form
          className="scanner-card"
          onSubmit={handleSubmit}
        >
          <textarea
            className="scanner-textarea"
            placeholder={placeholder}
            value={content}
            onChange={event =>
              setContent(event.target.value)
            }
          />

          {error && (
            <div className="scanner-error">
              <AlertTriangle size={19} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary full-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={19}
                  className="spin"
                />
                Analysing...
              </>
            ) : (
              <>
                <ShieldCheck size={19} />
                Analyze
              </>
            )}
          </button>
        </form>

        <TaskProgress
          title={`${
            type === "EMAIL" ? "Email" : "Message"
          } analysis task`}
          task={tracker.task}
        />

        {result && (
          <section
            className={`scanner-result ${riskClass}`}
          >
            <div className="result-heading">
              <ShieldCheck size={28} />

              <div>
                <h2>{result.riskLevel}</h2>
                <p>{result.summary}</p>
              </div>
            </div>

            <div className="risk-score-box">
              <span>Risk Score</span>
              <strong>
                {result.riskScore}/100
              </strong>
            </div>

            {result.reasons?.length > 0 && (
              <div className="result-list-box">
                <h3>Analysis Reasons</h3>

                <ul>
                  {result.reasons.map(
                    (reason, index) => (
                      <li key={index}>
                        {reason}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {result.suspiciousElements?.length > 0 && (
              <div className="result-list-box">
                <h3>Suspicious Elements</h3>

                <ul>
                  {result.suspiciousElements.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            <div className="recommendation-box">
              <h3>Recommendation</h3>
              <p>{result.recommendation}</p>
            </div>

            <button
              className="report-btn"
              onClick={() =>
                downloadSecurityReport({
                  title: `${type} Security Analysis`,
                  type,
                  input: content,
                  riskScore: result.riskScore,
                  riskLevel: result.riskLevel,
                  summary: result.summary,
                  reasons: result.reasons,
                  recommendation: result.recommendation
                })
              }
            >
              Download PDF Report
            </button>

            {saved && (
              <p className="scan-saved-message">
                Scan saved to history successfully.
              </p>
            )}

          </section>
        )}

      </div>
    </main>
  );
}
