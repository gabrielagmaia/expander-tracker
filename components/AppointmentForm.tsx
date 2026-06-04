"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAppointment } from "@/lib/expander";
import type { AppointmentType } from "@/types/expander";

const appointmentTypes: { value: AppointmentType; label: string; emoji: string }[] = [
  { value: "installation", label: "Installation", emoji: "🔧" },
  { value: "follow_up", label: "Follow-up", emoji: "🩺" },
  { value: "adjustment", label: "Adjustment", emoji: "⚙️" },
  { value: "emergency", label: "Emergency", emoji: "🚨" },
  { value: "final_check", label: "Final check", emoji: "🎉" },
  { value: "other", label: "Other", emoji: "📋" },
];

const inputCls =
  "w-full rounded-2xl px-4 py-3 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-colors";
const inputStyle = { border: "1.5px solid #E2E8F0", backgroundColor: "#FAFAFA" };

interface AppointmentFormProps {
  treatmentId: string;
}

export default function AppointmentForm({ treatmentId }: AppointmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    appointment_date: "",
    appointment_time: "",
    provider_name: "",
    location: "",
    appointment_type: "" as AppointmentType | "",
    notes: "",
    dentist_instructions: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.appointment_date) {
      setError("Please enter a date for this visit.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createAppointment({
        treatment_id: treatmentId,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time || null,
        provider_name: form.provider_name || null,
        location: form.location || null,
        appointment_type: (form.appointment_type as AppointmentType) || null,
        notes: form.notes || null,
        dentist_instructions: form.dentist_instructions || null,
      });
      router.push("/appointments");
    } catch {
      setError("Could not save this visit. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1.5">
          Date *
        </label>
        <input
          type="date"
          value={form.appointment_date}
          onChange={(e) => set("appointment_date", e.target.value)}
          className={inputCls}
          style={inputStyle}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1.5">
          Time
        </label>
        <input
          type="time"
          value={form.appointment_time}
          onChange={(e) => set("appointment_time", e.target.value)}
          className={inputCls}
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1.5">
          Visit type
        </label>
        <select
          value={form.appointment_type}
          onChange={(e) => set("appointment_type", e.target.value)}
          className={inputCls}
          style={inputStyle}
        >
          <option value="">Choose a type…</option>
          {appointmentTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.emoji} {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1.5">
          Dentist / Provider name
        </label>
        <input
          type="text"
          value={form.provider_name}
          onChange={(e) => set("provider_name", e.target.value)}
          placeholder="Dr. Smith"
          className={inputCls}
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1.5">
          Location
        </label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="Office name or address"
          className={inputCls}
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1.5">
          Dentist instructions
        </label>
        <textarea
          value={form.dentist_instructions}
          onChange={(e) => set("dentist_instructions", e.target.value)}
          rows={3}
          placeholder="e.g. increase to 2 turns per day after this visit"
          className={`${inputCls} resize-none`}
          style={inputStyle}
        />
        <p className="text-slate-400 text-xs mt-1.5">
          Follow your dentist&apos;s instructions when adjusting the treatment plan.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1.5">
          Notes
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          className={`${inputCls} resize-none`}
          style={inputStyle}
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm rounded-xl px-3 py-2 bg-red-50">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full text-white font-bold rounded-2xl py-4 transition-all active:scale-95 disabled:opacity-60 shadow-md"
        style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
      >
        {loading ? "Saving…" : "Save visit ✓"}
      </button>
    </form>
  );
}
