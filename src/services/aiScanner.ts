import { postJson } from "./api";

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


async function analyzeContent(
  endpoint: string,
  content: string
): Promise<AIAnalysisResult> {
  return postJson<AIAnalysisResult>(endpoint, { content }, 120000);
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