
import {
  AlertTriangle,
  FileDown,
  FileSearch,
  LoaderCircle,
  ShieldCheck,
  Upload
} from "lucide-react";

import {
  ChangeEvent,
  useState
} from "react";

import {
  scanFile,
  MAX_HASH_FILE_BYTES,
  MAX_UPLOAD_MB,
  type FileScanResult
} from "../services/fileScanner";

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

import TaskProgress from "../components/TaskProgress";

export default function FileScanner() {
  const [file, setFile] =
    useState<File | null>(null);

  const [result, setResult] =
    useSessionState<FileScanResult | null>(
      "file-scanner:result",
      null
    );

  const [error, setError] = useSessionState(
    "file-scanner:error",
    ""
  );

  const [saved, setSaved] = useSessionState(
    "file-scanner:saved",
    false
  );

  const [loading, setLoading] = useState(false);

  const tracker = useTaskTracker("file-scanner");

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selected = event.target.files?.[0];

    if (!selected) return;

    if (selected.size > MAX_HASH_FILE_BYTES) {
      setError("Maximum file size is 200 MB.");
      return;
    }

    setFile(selected);
    setError("");
    setSaved(false);

    // Previous successful result is preserved.
  };

  const handleScan = async () => {
    if (!file) {
      setError("Please select a file.");
      return;
    }

    setLoading(true);
    setError("");
    setSaved(false);

    tracker.start(
      "Preparing file fingerprint..."
    );

    try {
      const data = await scanFile(
        file,
        message => tracker.update(message)
      );

      if (data.pending) {
        const message =
          data.message || "Analysis is still pending.";

        setError(message);
        tracker.fail(message);
        return;
      }

      if (
        !data.stats ||
        typeof data.riskScore !== "number" ||
        !data.riskLevel
      ) {
        throw new Error(
          "Incomplete malware analysis response."
        );
      }

      setResult(data);

      tracker.finish(
        "File analysis completed"
      );

      try {
        await saveScan({
          type: "FILE",
          input: file.name,
          riskLevel: data.riskLevel,
          riskScore: data.riskScore,

          summary:
            `VirusTotal malware analysis of ${file.name}.`,

          recommendation:
            data.riskLevel === "HIGH RISK"
              ? "Do not open or share this file. Remove or quarantine it."
              : data.riskLevel === "SUSPICIOUS"
              ? "Use caution. Verify the file source before opening."
              : "No major malware threat was detected.",

          harmless: data.stats.harmless,
          malicious: data.stats.malicious,
          suspicious: data.stats.suspicious,
          undetected: data.stats.undetected,
          timeout: data.stats.timeout,
          analysisId: data.analysisId,

          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type
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
          : "File scan failed.";

      setError(message);
      tracker.fail(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="file-scanner-page">
      <div className="file-scanner-container">

        <div className="scanner-header">
          <div className="scanner-icon">
            <FileSearch size={30} />
          </div>

          <div>
            <h1>File Malware Scanner</h1>
            <p>
              Analyze files using VirusTotal malware intelligence.
            </p>
          </div>
        </div>

        <section className="file-card">

          <label className="file-upload-area">
            <Upload size={35} />

            <strong>Select a File</strong>

            <span>
              Upload up to {MAX_UPLOAD_MB} MB
              (larger files are checked by fingerprint)
            </span>

            <input
              type="file"
              hidden
              onChange={handleFileChange}
            />
          </label>

          {file && (
            <div className="selected-file">
              <FileSearch size={22} />

              <div>
                <strong>{file.name}</strong>

                <span>
                  {(file.size / 1024 / 1024).toFixed(2)}
                  {" "}MB
                </span>
              </div>
            </div>
          )}

          <div className="file-privacy-warning">
            Uploaded files may be submitted to VirusTotal.
            Do not upload confidential or private files.
          </div>

          {error && (
            <div className="scanner-error">
              <AlertTriangle size={19} />
              {error}
            </div>
          )}

          <button
            className="btn-primary full-btn"
            disabled={loading || !file}
            onClick={handleScan}
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
                <ShieldCheck size={19} />
                Scan File
              </>
            )}
          </button>

        </section>

        <TaskProgress
          title="File scan task"
          task={tracker.task}
        />

        {result?.stats &&
          result.riskLevel &&
          typeof result.riskScore === "number" && (
            <section className="file-result">

              <h2>{result.riskLevel}</h2>

              <div className="file-risk-score">
                <span>Risk Score</span>

                <strong>
                  {result.riskScore}/100
                </strong>
              </div>

              <div className="file-stat-grid">
                <article>
                  <span>Malicious</span>
                  <strong>{result.stats.malicious}</strong>
                </article>

                <article>
                  <span>Suspicious</span>
                  <strong>{result.stats.suspicious}</strong>
                </article>

                <article>
                  <span>Harmless</span>
                  <strong>{result.stats.harmless}</strong>
                </article>

                <article>
                  <span>Undetected</span>
                  <strong>{result.stats.undetected}</strong>
                </article>
              </div>

              <button
                className="report-btn"
                onClick={() =>
                  downloadSecurityReport({
                    title: "File Malware Security Report",
                    type: "FILE",
                    input:
                      result.fileName ||
                      file?.name ||
                      "Unknown file",

                    riskScore: result.riskScore!,
                    riskLevel: result.riskLevel!,

                    malicious: result.stats!.malicious,
                    suspicious: result.stats!.suspicious,
                    harmless: result.stats!.harmless,
                    undetected: result.stats!.undetected
                  })
                }
              >
                <FileDown size={18} />
                Download PDF
              </button>

              {saved && (
                <p className="scan-saved-message">
                  Scan saved to history successfully.
                </p>
              )}

              {!file && (
                <p className="scan-saved-message">
                  Previous scan result restored.
                  Select the file again to run another scan.
                </p>
              )}

            </section>
          )}

      </div>
    </main>
  );
}
