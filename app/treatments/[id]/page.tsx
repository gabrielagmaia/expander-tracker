"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import type {
  ExpanderTreatment,
  ExpanderDailyLog,
  DentistAppointment,
} from "@/types/expander";
import {
  getTreatmentById,
  getDailyLogs,
  getAppointments,
  calculateProgress,
  buildCompletedTurnMap,
} from "@/lib/expander";
import { formatDateLong } from "@/lib/dateUtils";
import ProgressCard from "@/components/ProgressCard";
import DailyLogList from "@/components/DailyLogList";
import AppointmentList from "@/components/AppointmentList";

const treatmentStatusStyle: Record<string, { bg: string; text: string; label: string }> = {
  active:    { bg: "#DCFCE7", text: "#166534", label: "Active" },
  completed: { bg: "#EDE9FE", text: "#5B21B6", label: "Completed" },
  paused:    { bg: "#FEF3C7", text: "#92400E", label: "Paused" },
  cancelled: { bg: "#F1F5F9", text: "#64748B", label: "Cancelled" },
};

function TreatmentStatusBadge({ status }: { status: string }) {
  const s = treatmentStatusStyle[status] ?? treatmentStatusStyle.cancelled;
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold flex-shrink-0"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-9 h-9 border-[3px] border-violet-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="font-black text-violet-600 text-2xl leading-none">{value}</p>
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
    </div>
  );
}

export default function TreatmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [treatment, setTreatment] = useState<ExpanderTreatment | null>(null);
  const [logs, setLogs] = useState<ExpanderDailyLog[]>([]);
  const [appointments, setAppointments] = useState<DentistAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [t, l, a] = await Promise.all([
          getTreatmentById(id),
          getDailyLogs(id),
          getAppointments(id),
        ]);
        setTreatment(t);
        setLogs(l);
        setAppointments(a);
      } catch {
        setError("Could not load this treatment. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <Spinner />;

  if (error) {
    return <p className="text-red-400 text-sm text-center py-8">{error}</p>;
  }

  if (!treatment) {
    return (
      <p className="text-slate-400 text-sm text-center py-8">Treatment not found.</p>
    );
  }

  const progress = calculateProgress(treatment, logs);
  const completedTurnNumbers = buildCompletedTurnMap(logs);

  const missedDays = logs.filter((l) => l.status === "missed").length;
  const skippedDays = logs.filter((l) => l.status === "skipped_by_dentist").length;

  // Derive completion date: prefer completed_at column, fall back to updated_at if completed
  const completionDateISO =
    treatment.completed_at
      ? treatment.completed_at.split("T")[0]
      : treatment.status === "completed"
      ? treatment.updated_at.split("T")[0]
      : null;

  // Sort all logs newest-first for the history list
  const sortedLogs = [...logs].sort((a, b) => (a.log_date > b.log_date ? -1 : 1));

  const isActive = treatment.status === "active";

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-violet-500 text-sm mb-5 hover:text-violet-700 transition-colors"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      {/* Header card */}
      <div
        className="bg-white rounded-3xl p-5 mb-4 shadow-sm"
        style={{ border: "1.5px solid #EDE9FE" }}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h1 className="text-2xl font-black text-slate-800">{treatment.child_name}</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Started {formatDateLong(treatment.start_date)}
            </p>
            {completionDateISO && (
              <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-green-500" />
                Completed {formatDateLong(completionDateISO)}
              </p>
            )}
          </div>
          <TreatmentStatusBadge status={treatment.status} />
        </div>

        {treatment.notes && (
          <p className="text-slate-500 text-sm mt-3 italic">&ldquo;{treatment.notes}&rdquo;</p>
        )}
      </div>

      {/* Progress */}
      <ProgressCard childName={treatment.child_name} progress={progress} />

      {/* Stats row */}
      <div
        className="bg-white rounded-3xl p-5 mt-4 shadow-sm"
        style={{ border: "1.5px solid #EDE9FE" }}
      >
        <div className="grid grid-cols-3 gap-2 divide-x divide-slate-100">
          <StatItem label="completed" value={progress.completedDays} />
          <StatItem label="missed" value={missedDays} />
          <StatItem label="skipped" value={skippedDays} />
        </div>
        <p className="text-center text-slate-400 text-xs mt-3">
          Prescribed: <span className="font-semibold text-slate-600">{treatment.total_days} completed turns</span>
        </p>
      </div>

      {/* Active-treatment actions */}
      {isActive && (
        <div className="mt-4 flex gap-2">
          <Link
            href="/"
            className="flex-1 text-center font-bold text-sm rounded-2xl py-3.5 transition-all active:scale-95 shadow-sm"
            style={{ backgroundColor: "#EDE9FE", color: "#6D28D9", border: "1.5px solid #DDD6FE" }}
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className="flex-1 text-center font-bold text-sm rounded-2xl py-3.5 transition-all active:scale-95 shadow-sm"
            style={{ backgroundColor: "#F8FAFC", color: "#475569", border: "1.5px solid #E2E8F0" }}
          >
            Settings
          </Link>
        </div>
      )}

      {/* Daily history */}
      {sortedLogs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-slate-500 font-semibold text-xs uppercase tracking-wide mb-3">
            Daily history
          </h2>
          <DailyLogList
            logs={sortedLogs}
            completedTurnNumbers={completedTurnNumbers}
          />
        </div>
      )}

      {/* Appointments */}
      {appointments.length > 0 && (
        <div className="mt-6">
          <h2 className="text-slate-500 font-semibold text-xs uppercase tracking-wide mb-3">
            Dentist visits
          </h2>
          <AppointmentList appointments={appointments} showSection={false} />
        </div>
      )}
    </div>
  );
}
