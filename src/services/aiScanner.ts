export type RiskLevel =
  | "SAFE"
  | "LOW RISK"
  | "SUSPICIOUS"
  | "HIGH RISK";

export interface AIAnalysisResult {

  success: boolean;

  type:
    | "EMAIL"
    | "MESSAGE";

  riskLevel: RiskLevel;

  riskScore: number;

  summary: string;

  reasons: string[];

  suspiciousElements: string[];

  recommendation: string;

  message?: string;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

async function analyzeContent(
  endpoint: string,
  content: string
): Promise<AIAnalysisResult> {

  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            content,
          }),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "AI analysis failed."
    );
  }

  return data;
}

export function analyzeEmail(
  content: string
) {
  return analyzeContent(
    "/api/analyze-email",
    content
  );
}

export function analyzeMessage(
  content: string
) {
  return analyzeContent(
    "/api/analyze-message",
    content
  );
}