import {
  ChangeEvent,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  FileImage,
  LoaderCircle,
  QrCode,
  ShieldCheck,
  Upload,
} from "lucide-react";

import jsQR from "jsqr";

import {
  scanUrl,
  type UrlScanResult,
} from "../services/urlScanner";

import {
  saveScan,
} from "../services/scanHistory";

import {
  downloadSecurityReport,
} from "../services/pdfReport";

export default function QrScanner() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imagePreview, setImagePreview] = useState("");
  const [decodedText, setDecodedText] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [result, setResult] = useState<UrlScanResult | null>(null);
  const [saved, setSaved] = useState(false);

  const decodeQrCode = async (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const image = new Image();

      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");

          const context = canvas.getContext("2d", {
            willReadFrequently: true,
          });

          if (!context) {
            reject(
              new Error("Unable to create image scanner.")
            );

            URL.revokeObjectURL(objectUrl);
            return;
          }

          canvas.width = image.naturalWidth || image.width;
          canvas.height = image.naturalHeight || image.height;

          context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );

          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );

          const qrResult = jsQR(
            imageData.data,
            imageData.width,
            imageData.height,
            {
              inversionAttempts: "attemptBoth",
            }
          );

          URL.revokeObjectURL(objectUrl);

          if (!qrResult?.data) {
            reject(
              new Error(
                "No QR code was detected in this image."
              )
            );

            return;
          }

          resolve(qrResult.data.trim());
        } catch (err) {
          URL.revokeObjectURL(objectUrl);

          reject(err);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);

        reject(
          new Error("Unable to read the selected image.")
        );
      };

      image.src = objectUrl;
    });
  };

  const normalizeUrl = (value: string) => {
    const clean = value.trim();

    if (
      clean.startsWith("http://") ||
      clean.startsWith("https://")
    ) {
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

    if (!file) {
      return;
    }

    setError("");
    setResult(null);
    setDecodedText("");
    setSaved(false);

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Maximum QR image size is 10 MB.");
      return;
    }

    const preview = URL.createObjectURL(file);

    setImagePreview((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return preview;
    });

    setLoading(true);

    try {
      const qrData = await decodeQrCode(file);

      setDecodedText(qrData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to decode QR code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScanUrl = async () => {
    if (!decodedText) {
      setError("Please upload and decode a QR code first.");
      return;
    }

    const url = normalizeUrl(decodedText);

    if (!isWebUrl(url)) {
      setError(
        "This QR code does not contain a valid website URL. CyberShield can display the decoded text, but VirusTotal URL scanning requires an http:// or https:// URL."
      );

      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSaved(false);

    try {
      const scanResult = await scanUrl(url);

      setResult(scanResult);

      if (!scanResult.pending) {
        try {
          await saveScan({
            type: "QR",
            input: url,
            riskLevel: scanResult.riskLevel,
            riskScore: scanResult.riskScore,
            summary: "QR code URL analyzed using VirusTotal.",
            harmless: scanResult.stats?.harmless ?? 0,
            malicious: scanResult.stats?.malicious ?? 0,
            suspicious: scanResult.stats?.suspicious ?? 0,
            undetected: scanResult.stats?.undetected ?? 0,
            timeout: scanResult.stats?.timeout ?? 0,
            analysisId: scanResult.analysisId,
          });

          setSaved(true);
        } catch (saveError) {
          console.error(
            "Unable to save QR scan:",
            saveError
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to scan QR URL."
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!result) {
      return;
    }

    downloadSecurityReport({
      title: "QR Code Security Report",
      type: "QR",
      input: result.url || decodedText,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      summary:
        result.pending
          ? "VirusTotal analysis is still processing."
          : "QR code URL analyzed using VirusTotal security engines.",
      malicious: result.stats?.malicious ?? 0,
      suspicious: result.stats?.suspicious ?? 0,
      harmless: result.stats?.harmless ?? 0,
      undetected: result.stats?.undetected ?? 0,
      recommendation:
        result.riskLevel === "HIGH RISK"
          ? "Do not open this QR URL. It may be malicious."
          : result.riskLevel === "SUSPICIOUS"
          ? "Use caution. Verify the source before opening this QR URL."
          : "The URL currently shows low risk, but always verify QR codes from unknown sources.",
    });
  };

  const chooseFile = () => {
    fileInputRef.current?.click();
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
              Upload a QR image, decode its content and scan website URLs for
              security threats.
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
            onClick={chooseFile}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                chooseFile();
              }
            }}
          >
            <Upload size={36} />

            <strong>Upload QR Code Image</strong>

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

          {loading && !result && (
            <div className="dashboard-live-loading">
              <LoaderCircle
                className="spin"
                size={20}
              />

              <span>Processing QR code...</span>
            </div>
          )}

          {error && (
            <div className="scanner-error">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {decodedText && (
            <div className="scanned-url-box">
              <span>Decoded QR Content</span>

              <p>{decodedText}</p>
            </div>
          )}

          {decodedText && (
            <button
              type="button"
              className="btn-primary full-btn"
              onClick={handleScanUrl}
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle
                    className="spin"
                    size={19}
                  />
                  Scanning...
                </>
              ) : (
                <>
                  <ShieldCheck size={19} />
                  Scan QR URL
                </>
              )}
            </button>
          )}
        </section>

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

                <p>
                  QR Code Security Analysis
                </p>
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

            <div className="scanned-url-box">
              <span>Scanned URL</span>

              <p>{result.url}</p>
            </div>

            <div className="recommendation-box">
              <h3>Security Recommendation</h3>

              <p>
                {result.riskLevel === "HIGH RISK"
                  ? "Do not open this QR URL. VirusTotal detected malicious activity."
                  : result.riskLevel === "SUSPICIOUS"
                  ? "Be careful before opening this QR URL. Verify the QR source first."
                  : "No major threat was detected, but QR codes from unknown sources should still be treated carefully."}
              </p>
            </div>

            {saved && (
              <p className="scan-saved-message">
                Scan saved to CyberShield AI history.
              </p>
            )}

            <button
              type="button"
              className="report-btn"
              onClick={downloadReport}
            >
              <FileImage size={18} />
              Download Security Report
            </button>
          </section>
        )}
      </div>
    </main>
  );
}