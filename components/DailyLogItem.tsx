import Link from "next/link";
import type { ExpanderDailyLog } from "@/types/expander";
import { formatDateShort, formatTime } from "@/lib/dateUtils";
import StatusBadge from "./StatusBadge";

interface DailyLogItemProps {
  log: ExpanderDailyLog;
  /**
   * 1-based completed-treatment-turn number for this log.
   * Only set for logs with status "done"; undefined for all other statuses.
   */
  completedTurnNumber?: number;
}

const circleStyle: Record<string, { bg: string; text: string }> = {
  done: { bg: "#BBF7D0", text: "#166534" },
  pending: { bg: "#E0F2FE", text: "#0369A1" },
  missed: { bg: "#FED7AA", text: "#9A3412" },
  skipped_by_dentist: { bg: "#EDE9FE", text: "#6D28D9" },
};

function circleContent(log: ExpanderDailyLog, completedTurnNumber?: number): string {
  if (log.status === "done" && completedTurnNumber !== undefined) {
    return String(completedTurnNumber);
  }
  if (log.status === "missed") return "✕";
  if (log.status === "skipped_by_dentist") return "—";
  return "·";
}

function primaryLabel(log: ExpanderDailyLog, completedTurnNumber?: number): string {
  if (log.status === "done" && completedTurnNumber !== undefined) {
    return `Treatment Day ${completedTurnNumber}`;
  }
  if (log.status === "missed") return "Missed day";
  if (log.status === "skipped_by_dentist") return "Skipped by dentist";
  return "Next treatment day";
}

export default function DailyLogItem({ log, completedTurnNumber }: DailyLogItemProps) {
  const style = circleStyle[log.status] ?? circleStyle.pending;

  return (
    <Link
      href={`/days/${log.id}`}
      className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 hover:shadow-md transition-shadow"
      style={{ border: "1.5px solid #F1F5F9" }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {circleContent(log, completedTurnNumber)}
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-slate-700 text-sm font-semibold">
          {primaryLabel(log, completedTurnNumber)}
        </span>
        <p className="text-slate-400 text-xs mt-0.5">
          {formatDateShort(log.log_date)}
          {log.completed_at && (
            <span className="text-green-600"> · done at {formatTime(log.completed_at)}</span>
          )}
        </p>
        {log.notes && (
          <p className="text-slate-400 text-xs truncate max-w-[160px] mt-0.5 italic">
            {log.notes}
          </p>
        )}
      </div>

      <div className="flex-shrink-0">
        <StatusBadge status={log.status} />
      </div>
    </Link>
  );
}
