import {
  AlertTriangle,
  FileDown,
  FileSearch,
  LoaderCircle,
  ShieldCheck,
  Upload,
} from "lucide-react";

import {
  ChangeEvent,
  useState,
} from "react";

import {
  scanFile,
} from "../services/fileScanner";

import type {
  FileScanResult,
} from "../services/fileScanner";

import {
  saveScan,
} from "../services/scanHistory";

import {
  downloadSecurityReport,
} from "../services/pdfReport";

export default function FileScanner() {
  const [file, setFile] =
    useState<File | null>(
      null
    );

  const [result, setResult] =
    useState<FileScanResult | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [saved, setSaved] =
    useState(false);

  const handleFileChange = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const selected =
      event.target.files?.[0];

    if (!selected) {
      return;
    }

    if (
      selected.size >
      32 * 1024 * 1024
    ) {
      setError(
        "Maximum file size is 32 MB."
      );
      return;
    }

    setFile(selected);
    setResult(null);
    setSaved(false);
    setError("");
  };

  const handleScan = async () => {
    if (!file) {
      setError(
        "Please select a file."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSaved(false);

      const data =
        await scanFile(
          file
        );

      if (
        data.pending
      ) {
        setError(
          data.message ||
            "Analysis is still pending."
        );

        return;
      }

      if (
        !data.stats ||
        typeof data.riskScore !==
          "number" ||
        !data.riskLevel
      ) {
        throw new Error(
          "Incomplete malware analysis response."
        );
      }

      setResult(data);

      await saveScan({
        type: "FILE",

        input:
          file.name,

        riskLevel:
          data.riskLevel,

        riskScore:
          data.riskScore,

        summary:
          `VirusTotal malware analysis of ${file.name}.`,

        recommendation:
          data.riskLevel ===
          "HIGH RISK"
            ? "Do not open or share this file. Remove or quarantine it."
            : data.riskLevel ===
              "SUSPICIOUS"
            ? "Use caution. Verify the file source before opening."
            : "No major malware threat was detected.",

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

        fileName:
          file.name,

        fileSize:
          file.size,

        mimeType:
          file.type,
      });

      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "File scan failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="file-scanner-page">
      <div className="file-scanner-container">
        <div className="scanner-header">
          <div className="scanner-icon">
            <FileSearch
              size={30}
            />
          </div>

          <div>
            <h1>
              File Malware Scanner
            </h1>

            <p>
              Analyze files using
              VirusTotal malware
              intelligence.
            </p>
          </div>
        </div>

        <section className="file-card">
          <label className="file-upload-area">
            <Upload size={35} />

            <strong>
              Select a File
            </strong>

            <span>
              Maximum size:
              32 MB
            </span>

            <input
              type="file"
              hidden
              onChange={
                handleFileChange
              }
            />
          </label>

          {file && (
            <div className="selected-file">
              <FileSearch
                size={22}
              />

              <div>
                <strong>
                  {file.name}
                </strong>

                <span>
                  {(
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2)}
                  {" "}
                  MB
                </span>
              </div>
            </div>
          )}

          <div className="file-privacy-warning">
            Uploaded files may
            be submitted to
            VirusTotal. Do not
            upload confidential
            or private files.
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
            className="btn-primary full-btn"
            disabled={
              loading ||
              !file
            }
            onClick={
              handleScan
            }
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={19}
                  className="spin"
                />

                Scanning File...
              </>
            ) : (
              <>
                <ShieldCheck
                  size={19}
                />

                Scan File
              </>
            )}
          </button>
        </section>

        {result &&
          result.stats &&
          result.riskLevel &&
          typeof result.riskScore ===
            "number" && (
          <section className="file-result">
            <h2>
              {
                result.riskLevel
              }
            </h2>

            <div className="file-risk-score">
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

            <div className="file-stat-grid">
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

            <button
              className="report-btn"
              onClick={() =>
                downloadSecurityReport(
                  {
                    title:
                      "File Malware Security Report",

                    type:
                      "FILE",

                    input:
                      file?.name ||
                      "Unknown file",

                    riskScore:
                      result.riskScore!,

                    riskLevel:
                      result.riskLevel!,

                    malicious:
                      result.stats!
                        .malicious,

                    suspicious:
                      result.stats!
                        .suspicious,

                    harmless:
                      result.stats!
                        .harmless,

                    undetected:
                      result.stats!
                        .undetected,
                  }
                )
              }
            >
              <FileDown
                size={18}
              />

              Download PDF
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