"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import type { ExpanderTreatment, TreatmentStatus } from "@/types/expander";
import { updateTreatment } from "@/lib/expander";

const inputCls =
  "w-full rounded-2xl px-4 py-3 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-colors";
const inputStyle = { border: "1.5px solid #E2E8F0", backgroundColor: "#FAFAFA" };

interface TreatmentSettingsFormProps {
  treatment: ExpanderTreatment;
}

export default function TreatmentSettingsForm({
  treatment,
}: TreatmentSettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    child_name: treatment.child_name,
    start_date: treatment.start_date,
    total_days: String(treatment.total_days),
    turns_per_day: String(treatment.turns_per_day),
    reminder_time: treatment.reminder_time ?? "",
    notes: treatment.notes ?? "",
    status: treatment.status as TreatmentStatus,
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
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
    if (isNaN(turnsPerDay) || turnsPerDay < 1) {
      setError("Turns per day must be at least 1.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateTreatment(treatment.id, {
        child_name: form.child_name,
        start_date: form.start_date,
        total_days: totalDays,
        turns_per_day: turnsPerDay,
        reminder_time: form.reminder_time || null,
        notes: form.notes || null,
        status: form.status,
      });
      setSaved(true);

      // After completing or cancelling, go to the treatments history page
      // so the user sees the record instead of a blank screen.
      if (form.status === "completed" || form.status === "cancelled") {
        router.push("/treatments");
      } else {
        router.refresh();
      }
    } catch {
      setError("Could not save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const newTotal = parseInt(form.total_days, 10);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
          Child info
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">
              Child name *
            </label>
            <input
              type="text"
              value={form.child_name}
              onChange={(e) => set("child_name", e.target.value)}
              className={inputCls}
              style={inputStyle}
              required
            />
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
          Treatment plan
        </p>
        <div className="flex flex-col gap-4">
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
            {!isNaN(newTotal) && newTotal !== treatment.total_days && (
              <p className={`text-xs mt-1.5 ${newTotal > treatment.total_days ? "text-violet-600" : "text-amber-600"}`}>
                {newTotal > treatment.total_days
                  ? `✨ Target increases to ${newTotal} completed turns — future logs will be created as needed.`
                  : `Reducing the target to ${newTotal} completed turns. All historical logs are preserved.`}
              </p>
            )}
            <p className="text-slate-400 text-xs mt-1">
              Adjust this if your dentist changes the plan.
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
              Reminder time
            </label>
            <input
              type="time"
              value={form.reminder_time}
              onChange={(e) => set("reminder_time", e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
            <p className="text-slate-400 text-xs mt-1">Optional — for your own reference.</p>
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
          Status &amp; notes
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">
              Treatment status
            </label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className={inputCls}
              style={inputStyle}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {(form.status === "completed" || form.status === "cancelled") && (
              <p className="text-amber-600 text-xs mt-1.5">
                {form.status === "completed"
                  ? "Marking as completed will stop log generation and move this treatment to history."
                  : "Marking as cancelled will stop log generation and archive this treatment."}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">
              Notes
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
        </div>
      </section>

      {error && (
        <p className="text-red-500 text-sm rounded-xl px-3 py-2 bg-red-50">
          {error}
        </p>
      )}

      {saved && (
        <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 rounded-xl py-2.5" style={{ border: "1px solid #BBF7D0" }}>
          <CheckCircle2 size={15} />
          <span className="text-sm font-semibold">Settings saved!</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full text-white font-bold rounded-2xl py-4 transition-all active:scale-95 disabled:opacity-60 shadow-md"
        style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
      >
        {loading ? "Saving…" : "Save settings ✓"}
      </button>
    </form>
  );
}
