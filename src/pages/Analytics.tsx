import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

export default function PasswordChecker() {
  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const analysis =
    useMemo(() => {
      const tests = {
        length:
          password.length >=
          12,

        uppercase:
          /[A-Z]/.test(
            password
          ),

        lowercase:
          /[a-z]/.test(
            password
          ),

        number:
          /\d/.test(
            password
          ),

        special:
          /[^A-Za-z0-9]/.test(
            password
          ),
      };

      let score = 0;

      if (tests.length) {
        score += 20;
      }

      if (
        tests.uppercase
      ) {
        score += 15;
      }

      if (
        tests.lowercase
      ) {
        score += 15;
      }

      if (tests.number) {
        score += 15;
      }

      if (
        tests.special
      ) {
        score += 25;
      }

      if (
        password.length >=
        16
      ) {
        score += 10;
      }

      const lower =
        password.toLowerCase();

      const commonPatterns = [
        "password",
        "123456",
        "qwerty",
        "admin",
        "welcome",
        "letmein",
      ];

      if (
        commonPatterns.some(
          (pattern) =>
            lower.includes(
              pattern
            )
        )
      ) {
        score -= 25;
      }

      if (
        /(.)\1\1/.test(
          password
        )
      ) {
        score -= 10;
      }

      score =
        Math.max(
          0,
          Math.min(
            100,
            score
          )
        );

      let label =
        "Very Weak";

      if (score >= 80) {
        label = "Strong";
      } else if (
        score >= 60
      ) {
        label = "Good";
      } else if (
        score >= 35
      ) {
        label = "Weak";
      }

      return {
        tests,
        score,
        label,
      };
    }, [password]);

  const Requirement = ({
    passed,
    text,
  }: {
    passed: boolean;
    text: string;
  }) => (
    <li
      className={
        passed
          ? "requirement-pass"
          : ""
      }
    >
      {passed ? (
        <CheckCircle2
          size={18}
        />
      ) : (
        <XCircle
          size={18}
        />
      )}

      {text}
    </li>
  );

  return (
    <main className="scanner-page">
      <div className="scanner-container">
        <div className="scanner-header">
          <div className="scanner-icon">
            <KeyRound
              size={30}
            />
          </div>

          <div>
            <h1>
              Password Strength
              Checker
            </h1>

            <p>
              Analyze password
              strength locally in
              your browser.
            </p>
          </div>
        </div>

        <section className="scanner-card">
          <div className="password-input-box">
            <KeyRound
              size={20}
            />

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter a password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >
              {showPassword ? (
                <EyeOff
                  size={19}
                />
              ) : (
                <Eye
                  size={19}
                />
              )}
            </button>
          </div>

          <div className="password-score-card">
            <span>
              Strength
            </span>

            <strong>
              {
                analysis.label
              }
            </strong>

            <div className="password-progress">
              <div
                style={{
                  width: `${analysis.score}%`,
                }}
              />
            </div>

            <p>
              Score:
              {" "}
              {analysis.score}
              /100
            </p>
          </div>

          <ul className="password-requirements">
            <Requirement
              passed={
                analysis.tests
                  .length
              }
              text="At least 12 characters"
            />

            <Requirement
              passed={
                analysis.tests
                  .uppercase
              }
              text="Uppercase letter"
            />

            <Requirement
              passed={
                analysis.tests
                  .lowercase
              }
              text="Lowercase letter"
            />

            <Requirement
              passed={
                analysis.tests
                  .number
              }
              text="At least one number"
            />

            <Requirement
              passed={
                analysis.tests
                  .special
              }
              text="Special character"
            />
          </ul>

          <div className="security-note">
            <ShieldCheck
              size={19}
            />

            Your password is
            analyzed locally and
            is not uploaded or
            stored.
          </div>
        </section>
      </div>
    </main>
  );
}