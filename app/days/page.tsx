"use client";

import { useEffect, useState } from "react";
import type { ExpanderTreatment, ExpanderDailyLog } from "@/types/expander";
import { getActiveTreatment, getDailyLogs } from "@/lib/expander";
import DailyLogList from "@/components/DailyLogList";
import EmptyState from "@/components/EmptyState";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-9 h-9 border-[3px] border-violet-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

export default function DaysPage() {
  const [treatment, setTreatment] = useState<ExpanderTreatment | null>(null);
  const [logs, setLogs] = useState<ExpanderDailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const t = await getActiveTreatment();
        setTreatment(t);
        if (t) {
          const allLogs = await getDailyLogs(t.id);
          setLogs(allLogs);
        }
      } catch {
        setError("Could not load days. Please refresh.");
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

  if (!treatment) {
    return (
      <EmptyState
        title="No treatment yet"
        description="Create a treatment first to start the daily checklist."
        actionLabel="Create treatment"
        actionHref="/treatment/new"
      />
    );
  }

  const activeLogs = logs.filter((l) => l.day_number <= treatment.total_days);
  const extraLogs = logs.filter((l) => l.day_number > treatment.total_days);

  const doneDays = activeLogs.filter((l) => l.status === "done").length;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-black text-slate-800">Daily checklist 📋</h1>
        <p className="text-slate-400 text-sm mt-1">
          {treatment.child_name} · {doneDays} done · {treatment.total_days} total days
        </p>
      </div>

      <DailyLogList
        logs={activeLogs}
        totalDays={treatment.total_days}
        showLabel="Treatment days"
      />

      {extraLogs.length > 0 && (
        <div className="mt-8">
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: "#FEF9F0", border: "1px solid #FED7AA" }}
          >
            <p className="text-amber-700 font-semibold text-xs uppercase tracking-wide mb-1">
              Historical / extra days
            </p>
            <p className="text-amber-600 text-xs mb-3">
              These days are beyond the current total and don&apos;t count toward progress.
            </p>
            <DailyLogList logs={extraLogs} totalDays={treatment.total_days} />
          </div>
        </div>
      )}
    </div>
  );
}
