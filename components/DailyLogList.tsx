import type { ExpanderDailyLog } from "@/types/expander";
import DailyLogItem from "./DailyLogItem";

interface DailyLogListProps {
  logs: ExpanderDailyLog[];
  /** Map from log ID → 1-based completed-treatment-turn number (for done logs). */
  completedTurnNumbers?: Map<string, number>;
  limit?: number;
  showLabel?: string;
}

export default function DailyLogList({
  logs,
  completedTurnNumbers,
  limit,
  showLabel,
}: DailyLogListProps) {
  const displayed = limit ? logs.slice(0, limit) : logs;

  if (displayed.length === 0) {
    return (
      <p className="text-slate-400 text-sm text-center py-6 italic">
        No daily logs yet. Once the treatment starts, each day will show up here.
      </p>
    );
  }

  return (
    <div>
      {showLabel && (
        <h3 className="text-slate-500 font-semibold text-xs uppercase tracking-wide mb-3">
          {showLabel}
        </h3>
      )}
      <div className="flex flex-col gap-2">
        {displayed.map((log) => (
          <DailyLogItem
            key={log.id}
            log={log}
            completedTurnNumber={completedTurnNumbers?.get(log.id)}
          />
        ))}
      </div>
    </div>
  );
}
