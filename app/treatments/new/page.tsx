"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTreatment, getActiveTreatment } from "@/lib/expander";
import { todayISO } from "@/lib/dateUtils";
import ExpanderIcon from "@/components/ExpanderIcon";
import Link from "next/link";

const inputCls =
  "w-full rounded-2xl px-4 py-3 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-colors";
const inputStyle = { border: "1.5px solid #E2E8F0", backgroundColor: "#FAFAFA" };

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-9 h-9 border-[3px] border-violet-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

export default function NewTreatmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    child_name: "",
    start_date: todayISO(),
    total_days: "21",
    turns_per_day: "1",
    reminder_time: "",
    notes: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const totalDays = parseInt(form.total_days, 10);
    const turnsPerDay = parseInt(form.turns_per_day, 10);

    if (!form.child_name || !form.start_date) {
      setError("Name and start date are required.");
      return;
    }
    if (isNaN(totalDays) || totalDays < 1) {
      setError("Total days must be at least 1.");
      return;
    }

    // Pre-flight check: inform the user before the server-side guard fires
    setChecking(true);
    setError(null);
    setBlockMessage(null);
    try {
      const existing = await getActiveTreatment();
      if (existing) {
        setBlockMessage(
          `${existing.child_name} already has an active treatment. Complete, pause, or cancel it in Settings before starting another one.`
        );
        return;
      }
    } finally {
      setChecking(false);
    }

    setLoading(true);
    try {
      await createTreatment({
        child_name: form.child_name,
        start_date: form.start_date,
        total_days: totalDays,
        turns_per_day: turnsPerDay || 1,
        reminder_time: form.reminder_time || null,
        notes: form.notes || null,
        status: "active",
      });
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create the treatment.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (checking) return <Spinner />;

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-7">
        <div className="flex justify-center mb-3">
          <ExpanderIcon size={64} showSparkle />
        </div>
        <h1 className="text-xl font-black text-slate-800">Start a new treatment</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
          Add the details so we can build the daily checklist.
        </p>
      </div>

      {blockMessage && (
        <div
          className="rounded-2xl p-4 mb-5"
          style={{ backgroundColor: "#FFF7ED", border: "1.5px solid #FED7AA" }}
        >
          <p className="text-amber-700 text-sm font-semibold mb-1">Treatment already active</p>
          <p className="text-amber-700 text-sm">{blockMessage}</p>
          <Link
            href="/settings"
            className="mt-3 inline-block text-sm font-bold text-amber-700 underline"
          >
            Go to Settings →
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">
            Child&apos;s name *
          </label>
          <input
            type="text"
            value={form.child_name}
            onChange={(e) => set("child_name", e.target.value)}
            placeholder="e.g. Emma"
            className={inputCls}
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">
            Start date *
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => set("start_date", e.target.value)}
            className={inputCls}
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">
            Total days
          </label>
          <input
            type="number"
            min={1}
            value={form.total_days}
            onChange={(e) => set("total_days", e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
          <p className="text-slate-400 text-xs mt-1.5">
            Prescribed number of completed turns. Default is 21. You can change this later from
            Settings.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">
            Turns per day
          </label>
          <input
            type="number"
            min={1}
            value={form.turns_per_day}
            onChange={(e) => set("turns_per_day", e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">
            Reminder time <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="time"
            value={form.reminder_time}
            onChange={(e) => set("reminder_time", e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">
            Notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            placeholder="Anything worth remembering…"
            className={`${inputCls} resize-none`}
            style={inputStyle}
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm rounded-xl px-3 py-2 bg-red-50">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !!blockMessage}
          className="w-full text-white font-bold rounded-2xl py-4 transition-all active:scale-95 disabled:opacity-60 shadow-md"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
        >
          {loading ? "Creating…" : "Start the treatment 🌸"}
        </button>
      </form>
    </div>
  );
}
