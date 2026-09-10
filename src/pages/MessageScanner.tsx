import AITextScanner from "../components/AITextScanner";

import {
  analyzeMessage,
} from "../services/aiScanner";

export default function MessageScanner() {
  return (
    <AITextScanner
      title="SMS & WhatsApp Scam Detector"
      subtitle="Analyze suspicious messages using AI."
      placeholder="Paste suspicious SMS or WhatsApp message here..."
      type="MESSAGE"
      analyze={analyzeMessage}
    />
  );
}