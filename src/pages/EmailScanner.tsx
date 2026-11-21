import AITextScanner from "../components/AITextScanner";

import {
  analyzeEmail,
} from "../services/aiScanner";

export default function EmailScanner() {
  return (
    <AITextScanner
      title="Email Phishing Detector"
      subtitle="Analyze suspicious emails using AI."
      placeholder="Paste the complete suspicious email here..."
      type="EMAIL"
      analyze={analyzeEmail}
    />
  );
}