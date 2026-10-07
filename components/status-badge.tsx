import type { DocumentStatus } from "@/lib/types";

const statusLabels: Record<DocumentStatus, string> = {
  queued: "Queued",
  extracting: "Extracting",
  summarizing: "Summarizing",
  completed: "Completed",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={`status-badge status-${status}`}>
      {status !== "completed" && status !== "failed" && (
        <span className="status-dot animate-pulse" />
      )}
      {statusLabels[status]}
    </span>
  );
}
