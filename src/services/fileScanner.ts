export interface FileScanResult {

  success: boolean;

  pending?: boolean;

  fileName?: string;

  fileSize?: number;

  mimeType?: string;

  analysisId: string;

  riskScore?: number;

  riskLevel?:
    | "SAFE"
    | "LOW RISK"
    | "SUSPICIOUS"
    | "HIGH RISK";

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

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export async function scanFile(
  file: File
): Promise<FileScanResult> {

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  const response =
    await fetch(
      `${API_URL}/api/scan-file`,
      {
        method: "POST",

        body: formData,
      }
    );

  const data =
    await response.json();

  if (
    !response.ok &&
    !data.pending
  ) {
    throw new Error(
      data.message ||
        "File scan failed."
    );
  }

  return data;
}