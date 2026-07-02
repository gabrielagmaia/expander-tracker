"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type {
  ExpanderTreatment,
  ExpanderDailyLog,
  DentistAppointment,
} from "@/types/expander";
import {
  getActiveTreatment,
  getLatestTreatment,
  getDailyLogs,
  calculateProgress,
  buildCompletedTurnMap,
  ensureActiveLogs,
  getDashboardState,
  getNextAppointment,
} from "@/lib/expander";
import { todayISO } from "@/lib/dateUtils";
import EmptyState from "@/components/EmptyState";
import ProgressCard from "@/components/ProgressCard";
import TodayTurnCard from "@/components/TodayTurnCard";
import DailyLogList from "@/components/DailyLogList";
import { NextAppointmentBanner } from "@/components/AppointmentList";
import ExpanderIcon from "@/components/ExpanderIcon";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-9 h-9 border-[3px] border-violet-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

export default function DashboardPage() {
  const [activeTreatment, setActiveTreatment] = useState<ExpanderTreatment | null>(null);
  const [latestTreatment, setLatestTreatment] = useState<ExpanderTreatment | null>(null);
  const [logs, setLogs] = useState<ExpanderDailyLog[]>([]);
  const [todayLog, setTodayLog] = useState<ExpanderDailyLog | null>(null);
  const [nextAppt, setNextAppt] = useState<DentistAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [active, latest] = await Promise.all([
        getActiveTreatment(),
        getLatestTreatment(),
      ]);
      setActiveTreatment(active);
      setLatestTreatment(latest);

      const t = active ?? latest;
      if (t) {
        const [initialLogs, appt] = await Promise.all([
          getDailyLogs(t.id),
          getNextAppointment(t.id),
        ]);

        let allLogs = initialLogs;
        if (active) {
          // Only create future logs for the active treatment.
          const created = await ensureActiveLogs(active, initialLogs);
          if (created) allLogs = await getDailyLogs(active.id);
        }

        const today = allLogs.find((l) => l.log_date === todayISO()) ?? null;
        setLogs(allLogs);
        setTodayLog(today);
        setNextAppt(appt);
      }
    } catch {
      setError("Could not load data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;

  if (error) {
    return <p className="text-red-400 text-sm text-center py-8">{error}</p>;
  }

  const state = getDashboardState(activeTreatment, latestTreatment);

  // ── State 3: no treatments at all ──────────────────────────────────────────
  if (state === "empty") {
    return (
      <EmptyState
        title="Let's get started! 🌸"
        description="Set up the first treatment and keep every tiny step organized."
        actionLabel="Create treatment"
        actionHref="/treatments/new"
      />
    );
  }

  // ── State 2: completed/paused history, no active treatment ─────────────────
  if (state === "has_history") {
    const t = latestTreatment!;
    const progress = calculateProgress(t, logs);

    return (
      <div className="flex flex-col gap-4">
        <div className="text-center py-1">
          <div className="flex justify-center mb-3">
            <ExpanderIcon size={52} showSparkle />
          </div>
          <p className="text-2xl font-black text-slate-800 leading-snug">
            {progress.isComplete ? "Treatment complete! 🎉" : "No active treatment"}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {t.child_name} · {progress.completedDays} of {t.total_days} turns completed
          </p>
        </div>

        <ProgressCard childName={t.child_name} progress={progress} />

        <div className="flex flex-col gap-2">
          <Link
            href={`/treatments/${t.id}`}
            className="block text-center font-bold text-sm rounded-2xl py-3.5 transition-all active:scale-95 shadow-sm"
            style={{ backgroundColor: "#EDE9FE", color: "#6D28D9", border: "1.5px solid #DDD6FE" }}
          >
            View journey →
          </Link>
          <Link
            href="/treatments/new"
            className="block text-center text-white font-bold text-sm rounded-2xl py-3.5 transition-all active:scale-95 shadow-md"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
          >
            Start new treatment
          </Link>
          <Link
            href="/treatments"
            className="block text-center text-slate-400 text-sm font-medium py-2"
          >
            View all treatments →
          </Link>
        </div>
      </div>
    );
  }

  // ── State 1: active treatment ───────────────────────────────────────────────
  const t = activeTreatment!;
  const progress = calculateProgress(t, logs);
  const completedTurnNumbers = buildCompletedTurnMap(logs);

  const todayTurnNumber =
    todayLog && todayLog.status === "done"
      ? (completedTurnNumbers.get(todayLog.id) ?? progress.nextTreatmentDayNumber)
      : progress.nextTreatmentDayNumber;

  const recentLogs = [...logs]
    .sort((a, b) => (a.log_date > b.log_date ? -1 : 1))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center py-1">
        <div className="flex justify-center mb-3">
          <ExpanderIcon size={52} showSparkle />
        </div>
        <p className="text-2xl font-black text-slate-800 leading-snug">
          Hi! Ready for today&apos;s tiny turn?
        </p>
        <p className="text-slate-400 text-sm mt-1">One tiny turn, one big smile.</p>
      </div>

      <ProgressCard childName={t.child_name} progress={progress} />

      <TodayTurnCard
        log={todayLog}
        treatmentId={t.id}
        todayTurnNumber={todayTurnNumber}
        onUpdated={load}
      />

      {nextAppt && <NextAppointmentBanner appt={nextAppt} />}

      {recentLogs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-500 font-semibold text-xs uppercase tracking-wide">
              Recent days
            </h3>
            <Link
              href="/days"
              className="text-violet-500 text-xs font-semibold hover:underline"
            >
              See all →
            </Link>
          </div>
          <DailyLogList
            logs={recentLogs}
            completedTurnNumbers={completedTurnNumbers}
          />
        </div>
      )}
    </div>
  );
}
