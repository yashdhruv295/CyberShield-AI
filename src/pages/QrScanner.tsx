
import {
  ChangeEvent,
  useRef,
  useState
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  FileDown,
  LoaderCircle,
  QrCode,
  ShieldCheck,
  Upload
} from "lucide-react";

import jsQR from "jsqr";

import {
  scanUrl,
  type UrlScanResult
} from "../services/urlScanner";

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

export default function QrScanner() {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [decodedText, setDecodedText] =
    useSessionState("qr-scanner:decoded", "");

  const [error, setError] =
    useSessionState("qr-scanner:error", "");

  const [result, setResult] =
    useSessionState<UrlScanResult | null>(
      "qr-scanner:result",
      null
    );

  const [saved, setSaved] =
    useSessionState("qr-scanner:saved", false);

  const [loading, setLoading] = useState(false);

  const tracker = useTaskTracker("qr-scanner");

  const decodeQrCode = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const image = new Image();

      const objectUrl =
        URL.createObjectURL(file);

      image.onload = () => {
        try {
          const canvas =
            document.createElement("canvas");

          const context = canvas.getContext(
            "2d",
            { willReadFrequently: true }
          );

          if (!context) {
            throw new Error(
              "Unable to create image scanner."
            );
          }

          canvas.width =
            image.naturalWidth || image.width;

          canvas.height =
            image.naturalHeight || image.height;

          context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );

          const pixels = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );

          const decoded = jsQR(
            pixels.data,
            pixels.width,
            pixels.height,
            {
              inversionAttempts: "attemptBoth"
            }
          );

          URL.revokeObjectURL(objectUrl);

          if (!decoded?.data) {
            throw new Error(
              "No QR code was detected in this image."
            );
          }

          resolve(decoded.data.trim());
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);

        reject(
          new Error(
            "Unable to read the selected image."
          )
        );
      };

      image.src = objectUrl;
    });

  const normalizeUrl = (value: string) => {
    const clean = value.trim();

    if (/^https?:\/\//i.test(clean)) {
      return clean;
    }

    if (
      /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(clean)
    ) {
      return `https://${clean}`;
    }

    return clean;
  };

  const isWebUrl = (value: string) => {
    try {
      const parsed = new URL(value);

      return (
        parsed.protocol === "http:" ||
        parsed.protocol === "https:"
      );
    } catch {
      return false;
    }
  };

  const handleImageChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSaved(false);

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(
        "Maximum QR image size is 10 MB."
      );
      return;
    }

    const preview =
      URL.createObjectURL(file);

    setImagePreview(previous => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return preview;
    });

    setLoading(true);

    tracker.start("Reading QR image...");

    try {
      const text = await decodeQrCode(file);

      setDecodedText(text);

      tracker.finish(
        "QR image decoded successfully"
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to decode QR code.";

      setError(message);
      tracker.fail(message);
    } finally {
      setLoading(false);
    }
  };

  const handleScanUrl = async () => {
    if (!decodedText) {
      setError(
        "Please upload and decode a QR code first."
      );
      return;
    }

    const url = normalizeUrl(decodedText);

    if (!isWebUrl(url)) {
      setError(
        "This QR code does not contain a valid website URL. The decoded text is shown, but VirusTotal URL scanning requires an http:// or https:// URL."
      );
      return;
    }

    setLoading(true);
    setError("");
    setSaved(false);

    tracker.start(
      "Submitting QR URL to VirusTotal..."
    );

    try {
      const scanResult = await scanUrl(
        url,
        message => tracker.update(message)
      );

      if (scanResult.pending) {
        setResult(scanResult);

        const message =
          scanResult.message ||
          "Analysis is still pending.";

        setError(message);

        tracker.fail(
          "VirusTotal analysis is still pending"
        );

        return;
      }

      setResult(scanResult);

      tracker.finish(
        "QR URL security analysis completed"
      );

      try {
        await saveScan({
          type: "QR",
          input: url,
          riskLevel: scanResult.riskLevel,
          riskScore: scanResult.riskScore,

          summary:
            "QR code URL analyzed using VirusTotal.",

          harmless:
            scanResult.stats?.harmless ?? 0,

          malicious:
            scanResult.stats?.malicious ?? 0,

          suspicious:
            scanResult.stats?.suspicious ?? 0,

          undetected:
            scanResult.stats?.undetected ?? 0,

          timeout:
            scanResult.stats?.timeout ?? 0,

          analysisId: scanResult.analysisId
        });

        setSaved(true);
      } catch (saveError) {
        console.error(
          "Unable to save QR scan:",
          saveError
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to scan QR URL.";

      setError(message);
      tracker.fail(message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;

    downloadSecurityReport({
      title: "QR Code Security Report",
      type: "QR",
      input: result.url || decodedText,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,

      summary: result.pending
        ? "VirusTotal analysis is still processing."
        : "QR code URL analyzed using VirusTotal security engines.",

      malicious:
        result.stats?.malicious ?? 0,

      suspicious:
        result.stats?.suspicious ?? 0,

      harmless:
        result.stats?.harmless ?? 0,

      undetected:
        result.stats?.undetected ?? 0,

      recommendation:
        result.riskLevel === "HIGH RISK"
          ? "Do not open this QR URL. It may be malicious."
          : result.riskLevel === "SUSPICIOUS"
          ? "Use caution. Verify the source before opening this QR URL."
          : "The URL currently shows low risk, but always verify QR codes from unknown sources."
    });
  };

  return (
    <main className="scanner-page">
      <div className="scanner-container">

        <div className="scanner-header">
          <div className="scanner-icon">
            <QrCode size={30} />
          </div>

          <div>
            <h1>QR Code Scam Scanner</h1>

            <p>
              Upload a QR image, decode its content
              and scan website URLs for security threats.
            </p>
          </div>
        </div>

        <section className="scanner-card">

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleImageChange}
            hidden
          />

          <div
            className="qr-upload-box"
            onClick={() =>
              fileInputRef.current?.click()
            }
            role="button"
            tabIndex={0}
            onKeyDown={event => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                fileInputRef.current?.click();
              }
            }}
          >
            <Upload size={36} />

            <strong>
              Upload QR Code Image
            </strong>

            <span>
              PNG, JPG, JPEG or WEBP • Maximum 10 MB
            </span>
          </div>

          {imagePreview && (
            <img
              src={imagePreview}
              alt="QR code preview"
              className="qr-preview"
            />
          )}

          {loading && (
            <p className="scan-saved-message">
              <LoaderCircle
                size={17}
                className="spin"
              />
              Processing...
            </p>
          )}

          {decodedText && (
            <div className="scanned-url-box">
              <span>Decoded QR Content</span>
              <p>{decodedText}</p>
            </div>
          )}

          {error && (
            <div className="scanner-error">
              <AlertTriangle size={19} />
              {error}
            </div>
          )}

          {decodedText && (
            <button
              className="btn-primary full-btn"
              onClick={handleScanUrl}
              disabled={loading}
            >
              <ShieldCheck size={19} />
              Scan QR URL
            </button>
          )}

        </section>

        <TaskProgress
          title="QR scan task"
          task={tracker.task}
        />

        {result && (
          <section className="scanner-result">

            <div className="result-heading">
              {result.riskLevel === "HIGH RISK" ||
              result.riskLevel === "SUSPICIOUS" ? (
                <AlertTriangle size={30} />
              ) : (
                <CheckCircle2 size={30} />
              )}

              <div>
                <h2>{result.riskLevel}</h2>
                <p>QR Code Security Analysis</p>
              </div>
            </div>

            <div className="risk-score-box">
              <span>Risk Score</span>

              <strong>
                {result.riskScore}/100
              </strong>
            </div>

            <div className="scan-stats-grid">
              <article>
                <span>Malicious</span>
                <strong>
                  {result.stats?.malicious ?? 0}
                </strong>
              </article>

              <article>
                <span>Suspicious</span>
                <strong>
                  {result.stats?.suspicious ?? 0}
                </strong>
              </article>

              <article>
                <span>Harmless</span>
                <strong>
                  {result.stats?.harmless ?? 0}
                </strong>
              </article>

              <article>
                <span>Undetected</span>
                <strong>
                  {result.stats?.undetected ?? 0}
                </strong>
              </article>
            </div>

            <button
              className="report-btn"
              onClick={downloadReport}
            >
              <FileDown size={18} />
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
