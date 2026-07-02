"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import type { ExpanderDailyLog, DailyLogStatus } from "@/types/expander";
import {
  getDailyLogById,
  getDailyLogs,
  updateDailyLog,
  buildCompletedTurnMap,
} from "@/lib/expander";
import { formatDateLong, formatTime } from "@/lib/dateUtils";
import StatusBadge from "@/components/StatusBadge";

const statuses: { value: DailyLogStatus; label: string; emoji: string }[] = [
  { value: "done", label: "Done", emoji: "✅" },
  { value: "pending", label: "Pending", emoji: "⏳" },
  { value: "missed", label: "Missed", emoji: "⚠️" },
  { value: "skipped_by_dentist", label: "Skipped by dentist", emoji: "🩺" },
];

const inputCls =
  "w-full rounded-2xl px-4 py-3 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 transition-colors";
const inputStyle = { border: "1.5px solid #E2E8F0", backgroundColor: "#FAFAFA" };

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-9 h-9 border-[3px] border-violet-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

function pageTitle(log: ExpanderDailyLog, turnNumber?: number): string {
  switch (log.status) {
    case "done":
      return turnNumber !== undefined ? `Treatment Day ${turnNumber}` : "Done";
    case "missed":
      return "Missed day";
    case "skipped_by_dentist":
      return "Skipped by dentist";
    default:
      return "Next treatment day";
  }
}

export default function DayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [log, setLog] = useState<ExpanderDailyLog | null>(null);
  const [turnNumber, setTurnNumber] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    status: "pending" as DailyLogStatus,
    discomfort_level: "",
    notes: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await getDailyLogById(id);
        setLog(data);
        if (data) {
          setForm({
            status: data.status,
            discomfort_level: data.discomfort_level
              ? String(data.discomfort_level)
              : "",
            notes: data.notes ?? "",
          });

          // Compute the completed-turn position for this log if it is done.
          if (data.status === "done") {
            const allLogs = await getDailyLogs(data.treatment_id);
            const turnMap = buildCompletedTurnMap(allLogs);
            setTurnNumber(turnMap.get(data.id));
          }
        }
      } catch {
        setError("Could not load this day. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!log) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const discomfortNum = form.discomfort_level
        ? parseInt(form.discomfort_level, 10)
        : null;
      const updated = await updateDailyLog(log.id, {
        status: form.status,
        discomfort_level: discomfortNum,
        notes: form.notes || null,
        completed_at:
          form.status === "done"
            ? log.completed_at ?? new Date().toISOString()
            : null,
      });
      setLog(updated);

      // Recompute turn number if status changed.
      if (updated.status === "done") {
        const allLogs = await getDailyLogs(updated.treatment_id);
        const turnMap = buildCompletedTurnMap(allLogs);
        setTurnNumber(turnMap.get(updated.id));
      } else {
        setTurnNumber(undefined);
      }

      setSaved(true);
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  if (!log) {
    return (
      <p className="text-slate-400 text-sm text-center py-8">
        Day not found.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-violet-500 text-sm mb-5 hover:text-violet-700 transition-colors"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      {/* Day header card */}
      <div
        className="bg-white rounded-3xl p-5 mb-5 shadow-sm"
        style={{ border: "1.5px solid #EDE9FE" }}
      >
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-black text-slate-800">
            {pageTitle(log, turnNumber)}
          </h1>
          <StatusBadge status={log.status} />
        </div>
        <p className="text-slate-400 text-sm">{formatDateLong(log.log_date)}</p>
        {log.completed_at && (
          <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
            <CheckCircle2 size={14} />
            Completed at {formatTime(log.completed_at)}
          </p>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Status selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">
            Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            {statuses.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, status: s.value }))
                }
                className={`flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold transition-all ${
                  form.status === s.value
                    ? "shadow-sm"
                    : "bg-white hover:bg-slate-50"
                }`}
                style={
                  form.status === s.value
                    ? { backgroundColor: "#EDE9FE", border: "2px solid #8B5CF6", color: "#6D28D9" }
                    : { border: "1.5px solid #E2E8F0", color: "#64748B" }
                }
              >
                <span>{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
          {form.status === "missed" && (
            <p
              className="text-orange-700 text-xs mt-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}
            >
              Please follow your dentist&apos;s instructions if a turn was missed.
            </p>
          )}
        </div>

        {/* Discomfort level */}
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">
            Discomfort level
          </label>
          <div className="flex gap-2">
            {["", "1", "2", "3", "4", "5"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm((f) => ({ ...f, discomfort_level: v }))}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                  form.discomfort_level === v
                    ? "text-white shadow-sm"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
                style={
                  form.discomfort_level === v
                    ? { background: "linear-gradient(135deg, #8B5CF6, #7C3AED)", border: "none" }
                    : { border: "1.5px solid #E2E8F0" }
                }
              >
                {v === "" ? "—" : v}
              </button>
            ))}
          </div>
          <p className="text-slate-400 text-xs mt-1.5">
            1 = very little · 5 = a lot
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            placeholder="Anything worth noting about this day…"
            className={`${inputCls} resize-none`}
            style={inputStyle}
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm rounded-xl px-3 py-2 bg-red-50">
            {error}
          </p>
        )}
        {saved && (
          <div
            className="flex items-center justify-center gap-2 text-green-700 rounded-xl py-2.5"
            style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
          >
            <CheckCircle2 size={15} />
            <span className="text-sm font-semibold">Saved!</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full text-white font-bold rounded-2xl py-4 transition-all active:scale-95 disabled:opacity-60 shadow-md"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
        >
          {saving ? "Saving…" : "Save changes ✓"}
        </button>
      </form>
    </div>
  );
}
