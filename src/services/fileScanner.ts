import { apiRequest, postJson, waitForAnalysis } from "./api";

export type FileRiskLevel = "SAFE" | "LOW RISK" | "SUSPICIOUS" | "HIGH RISK";

export interface FileScanResult {
  success: boolean;
  pending?: boolean;
  found?: boolean;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  sha256?: string;
  analysisId: string;
  riskScore?: number;
  riskLevel?: FileRiskLevel;
  stats?: {
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
    timeout: number;
    failure: number;
    unsupported: number;
  };
  message?: string;
}

// Vercel Functions accept request bodies up to 4.5 MB, so uploads above
// this size are only checked by hash. Override with VITE_MAX_UPLOAD_MB.
export const MAX_UPLOAD_MB = Number(import.meta.env.VITE_MAX_UPLOAD_MB) || 4;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

// Hash-only lookups work for files of any size (nothing is uploaded).
export const MAX_HASH_FILE_BYTES = 200 * 1024 * 1024;

async function sha256Hex(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function scanFile(
  file: File,
  onProgress?: (message: string) => void
): Promise<FileScanResult> {
  const meta = { fileName: file.name, fileSize: file.size, mimeType: file.type };

  // 1) Check by SHA-256 first: instant result, and the file never leaves the browser.
  onProgress?.("Calculating file fingerprint (SHA-256)...");
  let sha256 = "";
  if (window.crypto?.subtle) {
    try {
      sha256 = await sha256Hex(file);
      onProgress?.("Checking VirusTotal database...");
      const report = await postJson<FileScanResult>("/api/file-report", { sha256 });
      if (report.found) return { ...report, ...meta, sha256 };
    } catch (error) {
      // Hash lookup is an optimisation; fall through to upload unless rate limited.
      if ((error as { status?: number })?.status === 429) throw error;
      console.warn("Hash lookup failed, uploading instead:", error);
    }
  }

  // 2) Unknown file: upload it (only if small enough for the server).
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `VirusTotal has no report for this file and it is larger than ${MAX_UPLOAD_MB} MB, so it cannot be uploaded through this server. Try a smaller file.`
    );
  }

  onProgress?.("Uploading file to VirusTotal...");
  const formData = new FormData();
  formData.append("file", file);

  const first = await apiRequest<FileScanResult>(
    "/api/scan-file",
    { method: "POST", body: formData },
    120000
  );

  if (!first.pending) return { ...first, ...meta };

  const final = await waitForAnalysis(first, { intervalMs: 20000, maxAttempts: 9, onProgress });
  return { ...final, ...meta, sha256: final.sha256 || first.sha256 || sha256 };
}
