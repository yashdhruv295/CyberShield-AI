
import {
  useCallback,
  useEffect,
  useState
} from "react";

export type TaskSnapshot = {
  status:
    | "idle"
    | "running"
    | "completed"
    | "failed";

  startedAt: number | null;
  finishedAt: number | null;
  progress: number;
  stage: string;
  durationMs: number | null;
};

const EMPTY_TASK: TaskSnapshot = {
  status: "idle",
  startedAt: null,
  finishedAt: null,
  progress: 0,
  stage: "Ready",
  durationMs: null
};

function readTask(key: string): TaskSnapshot {
  try {
    const raw = sessionStorage.getItem(
      `cybershield:task:${key}`
    );

    return raw
      ? {
          ...EMPTY_TASK,
          ...JSON.parse(raw)
        }
      : EMPTY_TASK;
  } catch {
    return EMPTY_TASK;
  }
}

export function useTaskTracker(key: string) {
  const [task, setTask] =
    useState<TaskSnapshot>(() => readTask(key));

  useEffect(() => {
    try {
      sessionStorage.setItem(
        `cybershield:task:${key}`,
        JSON.stringify(task)
      );
    } catch (error) {
      console.warn(
        "Unable to persist task timer:",
        error
      );
    }
  }, [key, task]);

  const start = useCallback((stage: string) => {
    setTask({
      status: "running",
      startedAt: Date.now(),
      finishedAt: null,
      progress: 5,
      stage,
      durationMs: null
    });
  }, []);

  const update = useCallback(
    (stage: string, progress?: number) => {
      setTask(previous => {
        if (previous.status !== "running") {
          return previous;
        }

        return {
          ...previous,
          stage,
          progress: Math.min(
            94,
            Math.max(
              previous.progress,
              progress ?? previous.progress
            )
          )
        };
      });
    },
    []
  );

  const finish = useCallback(
    (stage = "Task completed") => {
      setTask(previous => {
        const finishedAt = Date.now();

        return {
          ...previous,
          status: "completed",
          finishedAt,
          durationMs: previous.startedAt
            ? finishedAt - previous.startedAt
            : 0,
          progress: 100,
          stage
        };
      });
    },
    []
  );

  const fail = useCallback(
    (stage = "Task failed") => {
      setTask(previous => {
        const finishedAt = Date.now();

        return {
          ...previous,
          status: "failed",
          finishedAt,
          durationMs: previous.startedAt
            ? finishedAt - previous.startedAt
            : 0,
          stage
        };
      });
    },
    []
  );

  return {
    task,
    start,
    update,
    finish,
    fail
  };
}
