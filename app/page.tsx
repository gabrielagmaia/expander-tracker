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
  getDailyLogs,
  getTodayLog,
  calculateProgress,
  getNextAppointment,
} from "@/lib/expander";
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
  const [treatment, setTreatment] = useState<ExpanderTreatment | null>(null);
  const [logs, setLogs] = useState<ExpanderDailyLog[]>([]);
  const [todayLog, setTodayLog] = useState<ExpanderDailyLog | null>(null);
  const [nextAppt, setNextAppt] = useState<DentistAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = await getActiveTreatment();
      setTreatment(t);
      if (t) {
        const [allLogs, today, appt] = await Promise.all([
          getDailyLogs(t.id),
          getTodayLog(t.id),
          getNextAppointment(t.id),
        ]);
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

  if (!treatment) {
    return (
      <EmptyState
        title="Let's get started! 🌸"
        description="Set up the first treatment and keep every tiny step organized."
        actionLabel="Create treatment"
        actionHref="/treatment/new"
      />
    );
  }

  const progress = calculateProgress(treatment, logs);
  const recentLogs = [...logs]
    .sort((a, b) => b.day_number - a.day_number)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      {/* Greeting hero */}
      <div className="text-center py-1">
        <div className="flex justify-center mb-3">
          <ExpanderIcon size={52} showSparkle />
        </div>
        <p className="text-2xl font-black text-slate-800 leading-snug">
          Hi! Ready for today&apos;s tiny turn?
        </p>
        <p className="text-slate-400 text-sm mt-1">
          One tiny turn, one big smile.
        </p>
      </div>

      <ProgressCard childName={treatment.child_name} progress={progress} />

      <TodayTurnCard
        log={todayLog}
        treatmentId={treatment.id}
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
          <DailyLogList logs={recentLogs} totalDays={treatment.total_days} />
        </div>
      )}
    </div>
  );
}
