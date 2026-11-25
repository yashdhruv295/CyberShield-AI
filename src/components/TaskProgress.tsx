
import { useEffect, useState } from "react";

import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  XCircle
} from "lucide-react";

import type {
  TaskSnapshot
} from "../hooks/useTaskTracker";

type Props = {
  title: string;
  task: TaskSnapshot;
};

function formatDuration(ms: number) {
  const totalSeconds = Math.max(
    0,
    Math.floor(ms / 1000)
  );

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours > 0
    ? `${hours}h ${remainingMinutes}m ${seconds}s`
    : minutes > 0
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;
}

export default function TaskProgress({
  title,
  task
}: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (task.status !== "running") {
      return;
    }

    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(id);
  }, [task.status]);

  if (task.status === "idle") {
    return null;
  }

  const elapsed = task.startedAt
    ? (
        task.status === "running"
          ? now
          : task.finishedAt ?? now
      ) - task.startedAt
    : 0;

  const estimatedProgress =
    task.status === "running"
      ? Math.min(
          92,
          Math.max(
            task.progress,
            8 + Math.floor(elapsed / 1800)
          )
        )
      : task.progress;

  const progress =
    task.status === "running"
      ? estimatedProgress
      : task.progress;

  return (
    <aside
      className={`task-progress-card task-${task.status}`}
      aria-live="polite"
    >
      <div className="task-progress-top">
        <div className="task-progress-title">
          {task.status === "running" ? (
            <LoaderCircle
              className="spin"
              size={19}
            />
          ) : task.status === "completed" ? (
            <CheckCircle2 size={19} />
          ) : (
            <XCircle size={19} />
          )}

          <div>
            <strong>{title}</strong>
            <span>{task.stage}</span>
          </div>
        </div>

        <div className="task-clock">
          <Clock3 size={16} />

          <strong>
            {formatDuration(elapsed)}
          </strong>
        </div>
      </div>

      <div className="task-progress-track">
        <span
          style={{
            width: `${progress}%`
          }}
        />
      </div>

      <div className="task-progress-bottom">
        <strong>{progress}%</strong>

        <span>
          {task.status === "running"
            ? "Estimated progress · API processing may vary"
            : task.status === "completed"
            ? `Completed in ${formatDuration(
                task.durationMs ?? elapsed
              )}`
            : `Stopped after ${formatDuration(
                task.durationMs ?? elapsed
              )}`}
        </span>
      </div>
    </aside>
  );
}
