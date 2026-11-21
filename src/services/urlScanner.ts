import { postJson, waitForAnalysis } from "./api";

export interface ScanStats {
  harmless: number;
  malicious: number;
  suspicious: number;
  undetected: number;
  timeout: number;
}

export interface UrlScanResult {
  success: boolean;
  pending?: boolean;
  url: string;
  analysisId: string;
  status: string;
  stats: ScanStats;
  riskScore: number;
  riskLevel: string;
  message?: string;
}

export async function scanUrl(
  url: string,
  onProgress?: (message: string) => void
): Promise<UrlScanResult> {
  const first = await postJson<UrlScanResult>("/api/scan-url", { url });

  if (!first.pending) return first;

  const final = await waitForAnalysis(first, { intervalMs: 20000, maxAttempts: 6, onProgress });
  return { ...final, url: first.url || url };
}
