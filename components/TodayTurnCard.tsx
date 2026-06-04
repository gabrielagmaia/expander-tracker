"use client";

import { useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import type { ExpanderDailyLog, DailyLogStatus } from "@/types/expander";
import { markTodayDone, updateDailyLog } from "@/lib/expander";
import { formatTime, formatDateLong } from "@/lib/dateUtils";
import StatusBadge from "./StatusBadge";

interface TodayTurnCardProps {
  log: ExpanderDailyLog | null;
  treatmentId: string;
  onUpdated: () => void;
}

export default function TodayTurnCard({
  log,
  treatmentId,
  onUpdated,
}: TodayTurnCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkDone() {
    setLoading(true);
    setError(null);
    try {
      await markTodayDone(treatmentId);
      onUpdated();
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(status: DailyLogStatus) {
    if (!log) return;
    setLoading(true);
    setError(null);
    try {
      await updateDailyLog(log.id, {
        status,
        completed_at: status === "done" ? new Date().toISOString() : null,
      });
      onUpdated();
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!log) {
    return (
      <div className="bg-white rounded-3xl p-5 shadow-sm" style={{ border: "1.5px solid #EDE9FE" }}>
        <p className="text-slate-400 text-sm text-center py-2">
          No log found for today. Check your treatment start date.
        </p>
      </div>
    );
  }

  const isDone = log.status === "done";

  return (
    <div
      className="rounded-3xl p-5 shadow-sm"
      style={{
        background: isDone
          ? "linear-gradient(135deg, #F0FDF4, #DCFCE7)"
          : "linear-gradient(135deg, #FAF5FF, #EDE9FE)",
        border: isDone ? "1.5px solid #BBF7D0" : "1.5px solid #DDD6FE",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base">🎯</span>
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
            Today&apos;s mission
          </h3>
        </div>
        <StatusBadge status={log.status} />
      </div>

      <p className="text-slate-500 text-xs mb-4 pl-6">
        {formatDateLong(log.log_date)} · Day {log.day_number}
      </p>

      {isDone ? (
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm" style={{ border: "1px solid #BBF7D0" }}>
          <CheckCircle2 size={28} className="text-green-500 mx-auto mb-1" />
          <p className="text-green-700 font-bold text-base">You did it today!</p>
          {log.completed_at && (
            <p className="text-green-600 text-sm mt-0.5 flex items-center justify-center gap-1">
              <Clock size={12} />
              at {formatTime(log.completed_at)}
            </p>
          )}
          <p className="text-green-600 text-xs mt-2 italic">One tiny turn, one big smile 💜</p>
        </div>
      ) : (
        <button
          onClick={handleMarkDone}
          disabled={loading}
          className="w-full text-white font-bold text-lg rounded-2xl py-5 transition-all active:scale-95 disabled:opacity-60 shadow-md"
          style={{
            background: loading
              ? "#A78BFA"
              : "linear-gradient(135deg, #8B5CF6, #7C3AED)",
          }}
        >
          {loading ? "Saving…" : "Mark today as done ✓"}
        </button>
      )}

      {log.status === "missed" && (
        <p className="mt-3 text-orange-700 text-xs text-center bg-orange-50 rounded-xl p-2.5" style={{ border: "1px solid #FED7AA" }}>
          Please follow your dentist&apos;s instructions if a turn was missed.
        </p>
      )}

      {error && (
        <p className="mt-2 text-red-500 text-xs text-center">{error}</p>
      )}

      {!isDone && (
        <div className="mt-3 flex gap-2 flex-wrap justify-center">
          {(["missed", "skipped_by_dentist"] as DailyLogStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={loading}
              className="text-xs text-slate-400 border border-slate-200 bg-white rounded-xl px-3 py-1.5 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              Mark as {s === "skipped_by_dentist" ? "skipped by dentist" : s}
            </button>
          ))}
        </div>
      )}

      {isDone && (
        <div className="mt-3 flex gap-2 flex-wrap justify-center">
          {(["missed", "skipped_by_dentist", "pending"] as DailyLogStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={loading}
              className="text-xs text-slate-400 underline hover:text-slate-600 transition-colors disabled:opacity-60"
            >
              Change to {s === "skipped_by_dentist" ? "skipped by dentist" : s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
