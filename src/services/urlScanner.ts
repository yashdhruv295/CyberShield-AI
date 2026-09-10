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

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export async function scanUrl(
  url: string
): Promise<UrlScanResult> {

  const response =
    await fetch(
      `${API_URL}/api/scan-url`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            url,
          }),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to scan URL."
    );
  }

  return data;
}