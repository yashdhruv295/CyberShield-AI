import {
  ArrowRight,
  Bot,
  FileSearch,
  Link2,
  MailWarning,
  MessageSquareWarning,
  QrCode,
  ShieldCheck,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

export default function Home() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <ShieldCheck size={18} />
            AI Powered Cyber Security
          </div>

          <h1>
            Protect Yourself
            Against Digital Threats
            with
            <span>
              {" "}
              CyberShield AI
            </span>
          </h1>

          <p>
            Analyze suspicious
            links, phishing emails,
            scam messages, QR
            codes and files with
            intelligent security
            tools.
          </p>

          <div className="hero-actions">
            <Link
              to="/login"
              className="btn-primary"
            >
              Get Started
              <ArrowRight
                size={18}
              />
            </Link>

            <Link
              to="/learning"
              className="btn-secondary"
            >
              Learn Cyber Security
            </Link>
          </div>
        </div>

        <div className="hero-security-card">
          <ShieldCheck
            size={90}
          />

          <h2>
            Smart Threat
            Protection
          </h2>

          <p>
            AI + VirusTotal +
            Firebase
          </p>
        </div>
      </section>

      <section className="features-section">
        <div className="section-heading">
          <span>
            Security Tools
          </span>

          <h2>
            Everything you need
            for safer browsing
          </h2>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <Link2 size={30} />
            <h3>
              URL Scanner
            </h3>
            <p>
              Detect suspicious
              and malicious web
              links.
            </p>
          </article>

          <article className="feature-card">
            <MailWarning
              size={30}
            />
            <h3>
              Email Detector
            </h3>
            <p>
              Analyze emails for
              phishing indicators.
            </p>
          </article>

          <article className="feature-card">
            <MessageSquareWarning
              size={30}
            />
            <h3>
              Scam Detector
            </h3>
            <p>
              Detect suspicious
              SMS and WhatsApp
              messages.
            </p>
          </article>

          <article className="feature-card">
            <QrCode size={30} />
            <h3>
              QR Scanner
            </h3>
            <p>
              Decode and inspect
              suspicious QR links.
            </p>
          </article>

          <article className="feature-card">
            <FileSearch
              size={30}
            />
            <h3>
              Malware Scanner
            </h3>
            <p>
              Scan uploaded files
              for malware threats.
            </p>
          </article>

          <article className="feature-card">
            <Bot size={30} />
            <h3>
              Cyber AI
            </h3>
            <p>
              Ask cybersecurity
              questions using an
              AI assistant.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}