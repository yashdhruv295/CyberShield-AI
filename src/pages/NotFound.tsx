import {
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <ShieldAlert
          size={70}
        />

        <h1>404</h1>

        <h2>
          Page Not Found
        </h2>

        <p>
          The CyberShield AI
          page you are looking
          for does not exist.
        </p>

        <Link
          to="/"
          className="btn-primary"
        >
          <ArrowLeft
            size={18}
          />
          Back to Home
        </Link>
      </div>
    </main>
  );
}