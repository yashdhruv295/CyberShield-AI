import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  ShieldAlert,
  XCircle,
} from "lucide-react";

type PasswordCheck = {
  label: string;
  passed: boolean;
};

export default function PasswordChecker() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const checks: PasswordCheck[] = useMemo(() => {
    return [
      {
        label: "At least 8 characters",
        passed: password.length >= 8,
      },
      {
        label: "Contains uppercase letter",
        passed: /[A-Z]/.test(password),
      },
      {
        label: "Contains lowercase letter",
        passed: /[a-z]/.test(password),
      },
      {
        label: "Contains a number",
        passed: /\d/.test(password),
      },
      {
        label: "Contains a special character",
        passed: /[^A-Za-z0-9]/.test(password),
      },
      {
        label: "At least 12 characters for stronger security",
        passed: password.length >= 12,
      },
    ];
  }, [password]);

  const result = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        label: "No Password",
        recommendation: "Enter a password to check its strength.",
      };
    }

    let score = 0;

    if (password.length >= 8) score += 15;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 10;

    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;

    const repeatedPattern =
      /(.)\1{2,}/.test(password) ||
      /(1234|abcd|qwerty|password|admin)/i.test(password);

    if (repeatedPattern) {
      score -= 20;
    }

    score = Math.max(0, Math.min(100, score));

    let label = "Weak";
    let recommendation =
      "Use a longer password with uppercase, lowercase, numbers and special characters.";

    if (score >= 80) {
      label = "Very Strong";
      recommendation =
        "Excellent password strength. Keep it unique and do not reuse it on other accounts.";
    } else if (score >= 60) {
      label = "Strong";
      recommendation =
        "Good password. You can make it even stronger by increasing its length.";
    } else if (score >= 40) {
      label = "Medium";
      recommendation =
        "Add more characters, numbers and special symbols to improve password security.";
    }

    return {
      score,
      label,
      recommendation,
    };
  }, [password]);

  const getRiskIcon = () => {
    if (result.score >= 60) {
      return <ShieldCheck size={30} />;
    }

    return <ShieldAlert size={30} />;
  };

  return (
    <main className="scanner-page">
      <div className="scanner-container">
        <div className="scanner-header">
          <div className="scanner-icon">
            <KeyRound size={30} />
          </div>

          <div>
            <h1>Password Strength Checker</h1>
            <p>
              Check password strength locally without sending your password
              anywhere.
            </p>
          </div>
        </div>

        <section className="scanner-card">
          <label htmlFor="password">
            Enter Password
          </label>

          <div className="password-input-box">
            <LockKeyhole size={20} />

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter a password"
              autoComplete="new-password"
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>

          <div className="password-score-card">
            <div>
              <span>Password Strength</span>
              <strong>{result.label}</strong>
            </div>

            <div className="password-progress">
              <div
                style={{
                  width: `${result.score}%`,
                }}
              />
            </div>

            <p>Security Score: {result.score}/100</p>
          </div>

          <ul className="password-requirements">
            {checks.map((check) => (
              <li
                key={check.label}
                className={
                  check.passed ? "requirement-pass" : ""
                }
              >
                {check.passed ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <XCircle size={18} />
                )}

                <span>{check.label}</span>
              </li>
            ))}
          </ul>

          <div className="recommendation-box">
            <h3>Security Recommendation</h3>

            <p>{result.recommendation}</p>
          </div>

          <div className="security-note">
            {getRiskIcon()}

            <div>
              <strong>Privacy Protection</strong>

              <p>
                CyberShield AI checks this password only inside your browser.
                Your password is not sent to Firebase, Gemini, VirusTotal or
                the backend server.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}