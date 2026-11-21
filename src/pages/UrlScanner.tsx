import {
  AlertTriangle,
  Download,
  Link2,
  LoaderCircle,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import {
  FormEvent,
  useState,
} from "react";

import {
  scanUrl,
} from "../services/urlScanner";

import type {
  UrlScanResult,
} from "../services/urlScanner";

import {
  saveScan,
} from "../services/scanHistory";

import {
  downloadSecurityReport,
} from "../services/pdfReport";

export default function UrlScanner() {
  const [url, setUrl] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [saved, setSaved] =
    useState(false);

  const [result, setResult] =
    useState<UrlScanResult | null>(
      null
    );

  const normalizeUrl = (
    value: string
  ) => {
    const clean =
      value.trim();

    if (
      /^https?:\/\//i.test(
        clean
      )
    ) {
      return clean;
    }

    return `https://${clean}`;
  };

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setSaved(false);
    setResult(null);

    const normalized =
      normalizeUrl(url);

    try {
      const parsed =
        new URL(normalized);

      if (
        parsed.protocol !==
          "http:" &&
        parsed.protocol !==
          "https:"
      ) {
        throw new Error();
      }
    } catch {
      setError(
        "Please enter a valid website URL."
      );
      return;
    }

    try {
      setLoading(true);

      const data =
        await scanUrl(
          normalized
        );

      if (
        data.pending
      ) {
        setError(
          data.message ||
            "Analysis is still pending. Please try again."
        );

        return;
      }

      setResult(data);

      try {
        await saveScan({
          type: "URL",

          input:
            normalized,

          riskLevel:
            data.riskLevel,

          riskScore:
            data.riskScore,

          summary:
            `VirusTotal URL security analysis for ${normalized}.`,

          recommendation:
            data.riskLevel ===
            "HIGH RISK"
              ? "Do not open or share this URL."
              : data.riskLevel ===
                "SUSPICIOUS"
              ? "Use caution before visiting this URL."
              : "No major threat was detected, but always browse carefully.",

          harmless:
            data.stats.harmless,

          malicious:
            data.stats.malicious,

          suspicious:
            data.stats.suspicious,

          undetected:
            data.stats.undetected,

          timeout:
            data.stats.timeout,

          analysisId:
            data.analysisId,
        });

        setSaved(true);
      } catch (
        saveError
      ) {
        console.error(
          saveError
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to scan URL."
      );
    } finally {
      setLoading(false);
    }
  };

  const getRiskIcon = () => {
    if (!result) {
      return null;
    }

    if (
      result.riskLevel ===
      "HIGH RISK"
    ) {
      return (
        <ShieldAlert
          size={32}
        />
      );
    }

    return (
      <ShieldCheck
        size={32}
      />
    );
  };

  return (
    <main className="scanner-page">
      <div className="scanner-container">
        <div className="scanner-header">
          <div className="scanner-icon">
            <Link2 size={30} />
          </div>

          <div>
            <h1>
              URL Security Scanner
            </h1>

            <p>
              Analyze suspicious
              links using
              VirusTotal.
            </p>
          </div>
        </div>

        <form
          className="scanner-card"
          onSubmit={handleSubmit}
        >
          <div className="url-input-box">
            <Link2 size={20} />

            <input
              type="text"
              placeholder="example.com"
              value={url}
              onChange={(event) =>
                setUrl(
                  event.target.value
                )
              }
            />
          </div>

          {error && (
            <div className="scanner-error">
              <AlertTriangle
                size={19}
              />

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
                <Search size={19} />
                Scan URL
              </>
            )}
          </button>
        </form>

        {result && (
          <section className="scanner-result">
            <div className="result-heading">
              <div className="result-icon">
                {getRiskIcon()}
              </div>

              <div>
                <h2>
                  {
                    result.riskLevel
                  }
                </h2>

                <p>
                  VirusTotal
                  security result
                </p>
              </div>
            </div>

            <div className="risk-score-box">
              <span>
                Risk Score
              </span>

              <strong>
                {
                  result.riskScore
                }
                /100
              </strong>
            </div>

            <div className="scan-stats-grid">
              <article>
                <span>
                  Malicious
                </span>

                <strong>
                  {
                    result.stats
                      .malicious
                  }
                </strong>
              </article>

              <article>
                <span>
                  Suspicious
                </span>

                <strong>
                  {
                    result.stats
                      .suspicious
                  }
                </strong>
              </article>

              <article>
                <span>
                  Harmless
                </span>

                <strong>
                  {
                    result.stats
                      .harmless
                  }
                </strong>
              </article>

              <article>
                <span>
                  Undetected
                </span>

                <strong>
                  {
                    result.stats
                      .undetected
                  }
                </strong>
              </article>
            </div>

            <div className="scanned-url-box">
              <span>
                Scanned URL
              </span>

              <p>
                {result.url}
              </p>
            </div>

            <button
              className="report-btn"
              onClick={() =>
                downloadSecurityReport(
                  {
                    title:
                      "URL Security Report",

                    type: "URL",

                    input:
                      result.url,

                    riskScore:
                      result.riskScore,

                    riskLevel:
                      result.riskLevel,

                    malicious:
                      result.stats
                        .malicious,

                    suspicious:
                      result.stats
                        .suspicious,

                    harmless:
                      result.stats
                        .harmless,

                    undetected:
                      result.stats
                        .undetected,
                  }
                )
              }
            >
              <Download
                size={18}
              />

              Download PDF Report
            </button>

            {saved && (
              <p className="scan-saved-message">
                Scan saved to
                history successfully.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}