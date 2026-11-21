import {
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import type {
  Timestamp,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebase";

type ScanRecord = {
  id: string;
  type?: string;
  input?: string;
  userName?: string;
  riskLevel?: string;
  riskScore?: number;
  createdAt?: Timestamp;
};

export default function AdminDashboard() {
  const [userCount, setUserCount] =
    useState(0);

  const [scans, setScans] =
    useState<ScanRecord[]>([]);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const unsubscribeUsers =
      onSnapshot(
        collection(
          db,
          "users"
        ),
        (snapshot) => {
          setUserCount(
            snapshot.size
          );
        },
        () => {
          setError(
            "Unable to load users."
          );
        }
      );

    const unsubscribeScans =
      onSnapshot(
        collection(
          db,
          "scans"
        ),
        (snapshot) => {
          const records =
            snapshot.docs.map(
              (document) => ({
                id:
                  document.id,

                ...document.data(),
              })
            ) as ScanRecord[];

          records.sort(
            (a, b) =>
              (b.createdAt
                ?.toMillis?.() ||
                0) -
              (a.createdAt
                ?.toMillis?.() ||
                0)
          );

          setScans(
            records
          );
        },
        () => {
          setError(
            "Unable to load scans."
          );
        }
      );

    return () => {
      unsubscribeUsers();
      unsubscribeScans();
    };
  }, []);

  const totals =
    useMemo(() => {
      let safe = 0;
      let suspicious = 0;
      let highRisk = 0;

      scans.forEach(
        (scan) => {
          const level =
            String(
              scan.riskLevel ||
                ""
            ).toUpperCase();

          if (
            level ===
              "SAFE" ||
            level ===
              "LOW RISK"
          ) {
            safe += 1;
          } else if (
            level ===
            "SUSPICIOUS"
          ) {
            suspicious += 1;
          } else if (
            level ===
            "HIGH RISK"
          ) {
            highRisk += 1;
          }
        }
      );

      return {
        safe,
        suspicious,
        highRisk,
      };
    }, [scans]);

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="scanner-header">
          <div className="scanner-icon">
            <ShieldCheck
              size={30}
            />
          </div>

          <div>
            <h1>
              Admin Dashboard
            </h1>

            <p>
              Monitor CyberShield
              AI users and scans.
            </p>
          </div>
        </div>

        <div className="admin-warning">
          This prototype does not
          use Firebase
          Authentication, so the
          admin page should not be
          considered securely
          protected in production.
        </div>

        {error && (
          <div className="scanner-error">
            {error}
          </div>
        )}

        <section className="admin-stats-grid">
          <article>
            <Users />
            <span>
              Users
            </span>
            <strong>
              {userCount}
            </strong>
          </article>

          <article>
            <ShieldCheck />
            <span>
              Total Scans
            </span>
            <strong>
              {scans.length}
            </strong>
          </article>

          <article>
            <span>
              Safe
            </span>
            <strong>
              {totals.safe}
            </strong>
          </article>

          <article>
            <span>
              Suspicious
            </span>
            <strong>
              {
                totals.suspicious
              }
            </strong>
          </article>

          <article>
            <span>
              High Risk
            </span>
            <strong>
              {
                totals.highRisk
              }
            </strong>
          </article>
        </section>

        <section className="admin-recent">
          <h2>
            Recent Scans
          </h2>

          <div className="admin-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Input</th>
                  <th>Risk</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {scans
                  .slice(
                    0,
                    8
                  )
                  .map(
                    (scan) => (
                      <tr
                        key={
                          scan.id
                        }
                      >
                        <td>
                          {
                            scan.userName ||
                            "-"
                          }
                        </td>

                        <td>
                          {
                            scan.type ||
                            "-"
                          }
                        </td>

                        <td>
                          {
                            scan.input ||
                            "-"
                          }
                        </td>

                        <td>
                          {
                            scan.riskLevel ||
                            "-"
                          }
                        </td>

                        <td>
                          {
                            scan.riskScore ??
                            0
                          }
                        </td>

                        <td>
                          {scan.createdAt
                            ?.toDate?.()
                            .toLocaleString() ||
                            "-"}
                        </td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}