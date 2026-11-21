import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebase";

export type ScanType =
  | "URL"
  | "EMAIL"
  | "MESSAGE"
  | "QR"
  | "FILE";

export interface StoredUser {

  id: string;

  name: string;

  mobile: string;
}

export interface SaveScanData {

  type: ScanType;

  input: string;

  riskLevel: string;

  riskScore: number;

  summary?: string;

  reasons?: string[];

  suspiciousElements?: string[];

  recommendation?: string;

  harmless?: number;

  malicious?: number;

  suspicious?: number;

  undetected?: number;

  timeout?: number;

  analysisId?: string;

  fileName?: string;

  fileSize?: number;

  mimeType?: string;
}

export function getLoggedUser():
  StoredUser | null {

  try {

    const raw =
      localStorage.getItem(
        "cyberShieldUser"
      );

    return raw
      ? JSON.parse(raw)
      : null;

  } catch {

    return null;
  }
}

export async function saveScan(
  data: SaveScanData
) {

  const user =
    getLoggedUser();

  if (!user?.id) {
    throw new Error(
      "Please login before saving scan history."
    );
  }

  return addDoc(
    collection(
      db,
      "scans"
    ),
    {

      ...data,

      userId:
        user.id,

      userName:
        user.name,

      userMobile:
        user.mobile,

      createdAt:
        serverTimestamp(),
    }
  );
}