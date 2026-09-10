import {
  History,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
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
  riskLevel?: string;
  riskScore?: number;
  createdAt?: Timestamp;
};

export default function ScanHistory() {
  const [scans, setScans] =
    useState<ScanRecord[]>([]);

  const [filter, setFilter] =
    useState("ALL");

  const [error, setError] =
    useState("");

  useEffect(() => {
    let userId = "";

    try {
      const raw =
        localStorage.getItem(
          "cyberShieldUser"
        );

      const user =
        raw
          ? JSON.parse(raw)
          : null;

      userId =
        user?.id || "";
    } catch {
      userId = "";
    }

    if (!userId) {
      return;
    }

    const scansQuery =
      query(
        collection(
          db,
          "scans"
        ),
        where(
          "userId",
          "==",
          userId
        )
      );

    return onSnapshot(
      scansQuery,
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

        setError("");
      },
      (snapshotError) => {
        console.error(
          snapshotError
        );

        setError(
          "Unable to load scan history."
        );
      }
    );
  }, []);

  const filtered =
    useMemo(() => {
      if (
        filter === "ALL"
      ) {
        return scans;
      }

      return scans.filter(
        (scan) =>
          String(
            scan.type ||
              ""
          ).toUpperCase() ===
          filter
      );
    }, [
      scans,
      filter,
    ]);

  const removeScan =
    async (
      scanId: string
    ) => {
      const confirmed =
        window.confirm(
          "Delete this scan from history?"
        );

      if (!confirmed) {
        return;
      }

      try {
        await deleteDoc(
          doc(
            db,
            "scans",
            scanId
          )
        );
      } catch {
        setError(
          "Unable to delete scan."
        );
      }
    };

  const filters = [
    "ALL",
    "URL",
    "EMAIL",
    "MESSAGE",
    "QR",
    "FILE",
  ];

  return (
    <main className="history-page">
      <div className="history-container">
        <div className="scanner-header">
          <div className="scanner-icon">
            <History
              size={30}
            />
          </div>

          <div>
            <h1>
              Scan History
            </h1>

            <p>
              Review your previous
              CyberShield scans.
            </p>
          </div>
        </div>

        <div className="history-filters">
          {filters.map(
            (item) => (
              <button
                key={item}
                className={
                  filter ===
                  item
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter(
                    item
                  )
                }
              >
                {item}
              </button>
            )
          )}
        </div>

        {error && (
          <div className="scanner-error">
            {error}
          </div>
        )}

        <div className="history-list">
          {filtered.length ===
          0 ? (
            <div className="empty-history">
              No scan history
              available.
            </div>
          ) : (
            filtered.map(
              (scan) => (
                <article
                  key={
                    scan.id
                  }
                  className="history-card"
                >
                  <div className="history-card-top">
                    <div>
                      <span className="history-type">
                        {
                          scan.type
                        }
                      </span>

                      <h3>
                        {
                          scan.input
                        }
                      </h3>
                    </div>

                    <button
                      className="history-delete"
                      onClick={() =>
                        removeScan(
                          scan.id
                        )
                      }
                    >
                      <Trash2
                        size={18}
                      />
                    </button>
                  </div>

                  <div className="history-meta">
                    <span>
                      Risk:
                      {" "}
                      {
                        scan.riskLevel
                      }
                    </span>

                    <span>
                      Score:
                      {" "}
                      {
                        scan.riskScore ??
                        0
                      }
                      /100
                    </span>

                    <span>
                      {scan.createdAt
                        ?.toDate?.()
                        .toLocaleString() ||
                        "Pending date"}
                    </span>
                  </div>
                </article>
              )
            )
          )}
        </div>
      </div>
    </main>
  );
}