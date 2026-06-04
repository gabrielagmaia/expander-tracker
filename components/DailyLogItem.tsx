import Link from "next/link";
import type { ExpanderDailyLog } from "@/types/expander";
import { formatDateShort, formatTime } from "@/lib/dateUtils";
import StatusBadge from "./StatusBadge";

interface DailyLogItemProps {
  log: ExpanderDailyLog;
  totalDays: number;
}

const dayCircleStyle: Record<string, { bg: string; text: string }> = {
  done: { bg: "#BBF7D0", text: "#166534" },
  pending: { bg: "#E0F2FE", text: "#0369A1" },
  missed: { bg: "#FED7AA", text: "#9A3412" },
  skipped_by_dentist: { bg: "#EDE9FE", text: "#6D28D9" },
};

export default function DailyLogItem({ log, totalDays }: DailyLogItemProps) {
  const isExtra = log.day_number > totalDays;
  const style = dayCircleStyle[log.status] ?? dayCircleStyle.pending;

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
        {log.day_number}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-700 text-sm font-semibold">
            Day {log.day_number}
          </span>
          {isExtra && (
            <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
              extra
            </span>
          )}
        </div>
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
