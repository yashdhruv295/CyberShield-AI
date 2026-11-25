
import { useEffect, useState } from "react";

export function useSessionState<T>(
  key: string,
  initialValue: T
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(
        `cybershield:${key}`
      );

      return stored === null
        ? initialValue
        : (JSON.parse(stored) as T);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(
        `cybershield:${key}`,
        JSON.stringify(value)
      );
    } catch (error) {
      console.warn(
        "Unable to persist scanner state:",
        error
      );
    }
  }, [key, value]);

  return [value, setValue] as const;
}
