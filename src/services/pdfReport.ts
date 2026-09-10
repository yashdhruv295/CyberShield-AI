import {
  jsPDF,
} from "jspdf";

export interface PdfScanData {

  title: string;

  type: string;

  input: string;

  riskScore: number;

  riskLevel: string;

  summary?: string;

  reasons?: string[];

  recommendation?: string;

  malicious?: number;

  suspicious?: number;

  harmless?: number;

  undetected?: number;
}

export function downloadSecurityReport(
  data: PdfScanData
) {

  const pdf =
    new jsPDF();

  let y = 20;

  const addLine = (
    text: string,
    gap = 8
  ) => {

    const lines =
      pdf.splitTextToSize(
        text,
        170
      );

    if (
      y +
        lines.length *
          6 >
      275
    ) {
      pdf.addPage();

      y = 20;
    }

    pdf.text(
      lines,
      20,
      y
    );

    y +=
      lines.length *
        6 +
      gap;
  };

  pdf.setFontSize(20);

  pdf.text(
    "CyberShield AI",
    20,
    y
  );

  y += 10;

  pdf.setFontSize(15);

  pdf.text(
    data.title,
    20,
    y
  );

  y += 12;

  pdf.setFontSize(11);

  addLine(
    `Scan Type: ${data.type}`
  );

  addLine(
    `Risk Level: ${data.riskLevel}`
  );

  addLine(
    `Risk Score: ${data.riskScore}/100`
  );

  addLine(
    `Date: ${new Date().toLocaleString()}`
  );

  addLine(
    `Scanned Input: ${data.input}`
  );

  if (data.summary) {
    addLine(
      `Summary: ${data.summary}`
    );
  }

  if (
    typeof data.malicious ===
    "number"
  ) {
    addLine(
      `Malicious Engines: ${data.malicious}`
    );
  }

  if (
    typeof data.suspicious ===
    "number"
  ) {
    addLine(
      `Suspicious Engines: ${data.suspicious}`
    );
  }

  if (
    typeof data.harmless ===
    "number"
  ) {
    addLine(
      `Harmless Engines: ${data.harmless}`
    );
  }

  if (
    typeof data.undetected ===
    "number"
  ) {
    addLine(
      `Undetected Engines: ${data.undetected}`
    );
  }

  if (
    data.reasons?.length
  ) {

    addLine(
      "Reasons:"
    );

    data.reasons.forEach(
      (
        reason,
        index
      ) => {

        addLine(
          `${index + 1}. ${reason}`,
          3
        );
      }
    );
  }

  if (
    data.recommendation
  ) {

    addLine(
      `Recommendation: ${data.recommendation}`
    );
  }

  pdf.save(
    `cybershield-${data.type
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )}-report.pdf`
  );
}