"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { ExpanderTreatment } from "@/types/expander";
import {
  getAllTreatments,
  getLogSummariesForTreatments,
} from "@/lib/expander";
import { formatDateLong } from "@/lib/dateUtils";
import EmptyState from "@/components/EmptyState";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-9 h-9 border-[3px] border-violet-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

const statusLabel: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  paused: "Paused",
  cancelled: "Cancelled",
};

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  completed: { bg: "#EDE9FE", text: "#5B21B6", border: "#DDD6FE" },
  paused: { bg: "#FEF9F0", text: "#92400E", border: "#FCD34D" },
  cancelled: { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0" },
};

interface TreatmentCardProps {
  treatment: ExpanderTreatment;
  completedDays: number;
  isActive?: boolean;
}

function TreatmentCard({ treatment: t, completedDays, isActive }: TreatmentCardProps) {
  const c = statusColor[t.status] ?? statusColor.cancelled;
  const remaining = Math.max(t.total_days - completedDays, 0);

  // Derive completion date: prefer completed_at stamp, else show updated_at for completed status
  const completionDateISO =
    t.completed_at
      ? t.completed_at.split("T")[0]
      : t.status === "completed"
      ? t.updated_at.split("T")[0]
      : null;

  return (
    <div
      className="bg-white rounded-3xl p-5 shadow-sm"
      style={{ border: `1.5px solid ${c.border}`, backgroundColor: c.bg }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-800 text-lg leading-tight">{t.child_name}</p>
          <p className="text-slate-400 text-xs mt-0.5">Started {formatDateLong(t.start_date)}</p>
          {completionDateISO && t.status === "completed" && (
            <p className="text-slate-400 text-xs mt-0.5">
              Completed {formatDateLong(completionDateISO)}
            </p>
          )}
        </div>
        <span
          className="flex-shrink-0 text-xs font-semibold rounded-full px-2.5 py-1"
          style={{ backgroundColor: c.border, color: c.text }}
        >
          {statusLabel[t.status]}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>
            <span className="font-semibold text-slate-700">{completedDays}</span> of{" "}
            <span className="font-semibold text-slate-700">{t.total_days}</span> completed
          </span>
          {isActive && remaining > 0 && (
            <span>{remaining} remaining</span>
          )}
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#EDE9FE" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.round((completedDays / t.total_days) * 100))}%`,
              background: "linear-gradient(90deg, #8B5CF6, #A78BFA)",
            }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/treatments/${t.id}`}
          className="flex-1 text-center text-sm font-semibold rounded-2xl py-2.5 transition-all active:scale-95"
          style={{ backgroundColor: "#EDE9FE", color: "#6D28D9", border: "1.5px solid #DDD6FE" }}
        >
          {isActive ? "View journey" : "View details"}
        </Link>
        {isActive && (
          <Link
            href="/settings"
            className="flex-1 text-center text-sm font-semibold rounded-2xl py-2.5 transition-all active:scale-95"
            style={{ backgroundColor: "#F8FAFC", color: "#475569", border: "1.5px solid #E2E8F0" }}
          >
            Settings
          </Link>
        )}
      </div>
    </div>
  );
}

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<ExpanderTreatment[]>([]);
  const [logSummaries, setLogSummaries] = useState<Record<string, { completedDays: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const all = await getAllTreatments();
        setTreatments(all);
        if (all.length > 0) {
          const summaries = await getLogSummariesForTreatments(all.map((t) => t.id));
          setLogSummaries(summaries);
        }
      } catch {
        setError("Could not load treatments.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Spinner />;

  if (error) {
    return <p className="text-red-400 text-sm text-center py-8">{error}</p>;
  }

  if (treatments.length === 0) {
    return (
      <EmptyState
        title="No treatments yet"
        description="Start the first treatment to begin tracking daily turns."
        actionLabel="Start treatment"
        actionHref="/treatments/new"
      />
    );
  }

  const active = treatments.filter((t) => t.status === "active");
  const previous = treatments.filter((t) => t.status !== "active");
  const hasActive = active.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-black text-slate-800">My treatments 🌸</h1>
        {!hasActive && (
          <Link
            href="/treatments/new"
            className="flex items-center gap-1.5 text-white text-sm font-bold rounded-2xl px-4 py-2.5 shadow-md transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
          >
            <Plus size={15} />
            New
          </Link>
        )}
      </div>

      {/* Current treatment */}
      {hasActive && (
        <section className="mb-7">
          <h2 className="text-slate-500 font-semibold text-xs uppercase tracking-wide mb-3">
            Current treatment
          </h2>
          <div className="flex flex-col gap-3">
            {active.map((t) => (
              <TreatmentCard
                key={t.id}
                treatment={t}
                completedDays={logSummaries[t.id]?.completedDays ?? 0}
                isActive
              />
            ))}
          </div>
        </section>
      )}

      {/* Start new — only when no active treatment */}
      {!hasActive && (
        <div
          className="rounded-3xl p-5 mb-7 text-center"
          style={{ backgroundColor: "#FAF5FF", border: "1.5px dashed #DDD6FE" }}
        >
          <p className="text-slate-500 text-sm mb-3">
            Ready to start a new treatment cycle?
          </p>
          <Link
            href="/treatments/new"
            className="inline-flex items-center gap-2 text-white font-bold text-sm rounded-2xl px-6 py-3 shadow-md transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
          >
            <Plus size={15} />
            Start new treatment
          </Link>
        </div>
      )}

      {/* Previous treatments */}
      {previous.length > 0 && (
        <section>
          <h2 className="text-slate-500 font-semibold text-xs uppercase tracking-wide mb-3">
            Previous treatments
          </h2>
          <div className="flex flex-col gap-3">
            {previous.map((t) => (
              <TreatmentCard
                key={t.id}
                treatment={t}
                completedDays={logSummaries[t.id]?.completedDays ?? 0}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
