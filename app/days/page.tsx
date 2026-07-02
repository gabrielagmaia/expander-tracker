"use client";

import { useEffect, useState } from "react";
import type { ExpanderTreatment, ExpanderDailyLog } from "@/types/expander";
import {
  getActiveTreatment,
  getDailyLogs,
  buildCompletedTurnMap,
} from "@/lib/expander";
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

  const doneDays = logs.filter((l) => l.status === "done").length;
  const completedTurnNumbers = buildCompletedTurnMap(logs);

  // Logs are already ordered by log_date ascending from getDailyLogs.
  // Show most recent first so users see today at the top.
  const sortedLogs = [...logs].sort((a, b) => (a.log_date > b.log_date ? -1 : 1));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-black text-slate-800">Daily checklist 📋</h1>
        <p className="text-slate-400 text-sm mt-1">
          {treatment.child_name} · {doneDays} of {treatment.total_days} completed
        </p>
      </div>

      <DailyLogList
        logs={sortedLogs}
        completedTurnNumbers={completedTurnNumbers}
        showLabel="Treatment history"
      />
    </div>
  );
}
