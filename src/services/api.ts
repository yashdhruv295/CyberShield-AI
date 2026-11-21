// Shared helper for talking to the CyberShield backend.

export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function friendlyStatusMessage(status: number) {
  if (status === 413) return "The file is too large for the server.";
  if (status === 404) return "Backend route not found. Check VITE_API_URL points to the backend.";
  if (status === 504) return "The server took too long to respond. Please try again.";
  if (status >= 500) return "Backend server error. Please try again.";
  return `Request failed (HTTP ${status}).`;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = 90000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      throw new ApiError(0, "The request timed out. Please try again.");
    }
    throw new ApiError(
      0,
      `Cannot reach the backend at ${API_URL}. Make sure the server is running and this site's URL is in the backend FRONTEND_URL setting.`
    );
  } finally {
    clearTimeout(timer);
  }

  const raw = await response.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.message || friendlyStatusMessage(response.status));
  }

  if (data === null) {
    throw new ApiError(response.status, "Backend returned an invalid response.");
  }

  return data as T;
}

export function postJson<T>(path: string, body: unknown, timeoutMs?: number) {
  return apiRequest<T>(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    timeoutMs
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Pendable = { pending?: boolean; analysisId?: string };

/**
 * Keeps checking a VirusTotal analysis until it finishes.
 * The free VirusTotal API allows 4 requests/minute, so we poll slowly.
 */
export async function waitForAnalysis<T extends Pendable>(
  initial: T,
  options: { intervalMs?: number; maxAttempts?: number; onProgress?: (message: string) => void } = {}
): Promise<T> {
  const { intervalMs = 20000, maxAttempts = 9, onProgress } = options;
  let current = initial;

  for (let attempt = 1; current.pending && current.analysisId && attempt <= maxAttempts; attempt++) {
    onProgress?.(`VirusTotal is still analysing... checking again (${attempt}/${maxAttempts})`);
    await sleep(intervalMs);

    try {
      const update = await apiRequest<T>(`/api/analysis/${encodeURIComponent(current.analysisId)}`);
      current = { ...current, ...update };
    } catch (error) {
      // Rate limited: wait and keep trying instead of failing.
      if (error instanceof ApiError && error.status === 429) continue;
      throw error;
    }
  }

  if (current.pending) {
    return {
      ...current,
      message:
        "VirusTotal is taking longer than usual to finish this analysis. Please try the scan again in a minute.",
    };
  }

  return current;
}
