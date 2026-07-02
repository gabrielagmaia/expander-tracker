import { getSupabase } from "./supabaseClient";
import {
  addDays,
  dayNumberForDate,
  logDateForDay,
  todayISO,
} from "./dateUtils";
import type {
  ExpanderTreatment,
  ExpanderDailyLog,
  DentistAppointment,
  TreatmentProgress,
} from "@/types/expander";

// ─── Treatments ───────────────────────────────────────────────────────────────

export async function getActiveTreatment(): Promise<ExpanderTreatment | null> {
  const { data, error } = await getSupabase()
    .from("expander_treatments")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getTreatmentById(
  id: string
): Promise<ExpanderTreatment | null> {
  const { data, error } = await getSupabase()
    .from("expander_treatments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createTreatment(
  input: Omit<ExpanderTreatment, "id" | "created_at" | "updated_at">
): Promise<ExpanderTreatment> {
  const { data, error } = await getSupabase()
    .from("expander_treatments")
    .insert(input)
    .select()
    .single();
  if (error) throw error;

  await generateDailyLogs(data.id, data.start_date, data.total_days);
  return data;
}

export async function updateTreatment(
  id: string,
  updates: Partial<Omit<ExpanderTreatment, "id" | "created_at" | "updated_at">>
): Promise<ExpanderTreatment> {
  const { data, error } = await getSupabase()
    .from("expander_treatments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  // Whenever total_days changes, ensure enough future calendar logs exist.
  // We never delete historical logs — only add missing ones.
  if (updates.total_days !== undefined) {
    const logs = await getDailyLogs(id);
    await ensureActiveLogs(id, data.start_date, data.total_days, logs);
  }

  return data;
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────

export async function generateDailyLogs(
  treatmentId: string,
  startDate: string,
  totalDays: number
): Promise<void> {
  const logs = Array.from({ length: totalDays }, (_, i) => {
    const dayNumber = i + 1;
    return {
      treatment_id: treatmentId,
      day_number: dayNumber,
      log_date: logDateForDay(startDate, dayNumber),
      status: "pending" as const,
    };
  });

  const { error } = await getSupabase()
    .from("expander_daily_logs")
    .upsert(logs, { onConflict: "treatment_id,log_date", ignoreDuplicates: true });
  if (error) throw error;
}

/**
 * Ensures calendar logs exist from start_date through (today + remainingDays),
 * so that missed or skipped days never leave the treatment without a future row.
 *
 * Returns true if any new logs were inserted (so callers can re-fetch if needed).
 */
export async function ensureActiveLogs(
  treatmentId: string,
  startDate: string,
  totalDays: number,
  existingLogs: ExpanderDailyLog[]
): Promise<boolean> {
  const completedDays = existingLogs.filter((l) => l.status === "done").length;
  if (completedDays >= totalDays) return false; // treatment already complete

  const remainingDays = totalDays - completedDays;
  const today = todayISO();
  const neededThrough = addDays(today, remainingDays);

  const existingDates = new Set(existingLogs.map((l) => l.log_date));

  const logsToCreate: Array<{
    treatment_id: string;
    day_number: number;
    log_date: string;
    status: "pending";
  }> = [];

  let cursor = startDate;
  while (cursor <= neededThrough) {
    if (!existingDates.has(cursor)) {
      logsToCreate.push({
        treatment_id: treatmentId,
        day_number: dayNumberForDate(startDate, cursor),
        log_date: cursor,
        status: "pending",
      });
    }
    cursor = addDays(cursor, 1);
  }

  if (logsToCreate.length === 0) return false;

  const { error } = await getSupabase()
    .from("expander_daily_logs")
    .upsert(logsToCreate, {
      onConflict: "treatment_id,log_date",
      ignoreDuplicates: true,
    });
  if (error) throw error;
  return true;
}

export async function getDailyLogs(
  treatmentId: string
): Promise<ExpanderDailyLog[]> {
  const { data, error } = await getSupabase()
    .from("expander_daily_logs")
    .select("*")
    .eq("treatment_id", treatmentId)
    .order("log_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getDailyLogById(
  id: string
): Promise<ExpanderDailyLog | null> {
  const { data, error } = await getSupabase()
    .from("expander_daily_logs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getTodayLog(
  treatmentId: string
): Promise<ExpanderDailyLog | null> {
  const today = todayISO();
  const { data, error } = await getSupabase()
    .from("expander_daily_logs")
    .select("*")
    .eq("treatment_id", treatmentId)
    .eq("log_date", today)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateDailyLog(
  id: string,
  updates: Partial<
    Pick<
      ExpanderDailyLog,
      "status" | "completed_at" | "discomfort_level" | "notes"
    >
  >
): Promise<ExpanderDailyLog> {
  const { data, error } = await getSupabase()
    .from("expander_daily_logs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markTodayDone(
  treatmentId: string
): Promise<ExpanderDailyLog> {
  const today = todayISO();
  const { data, error } = await getSupabase()
    .from("expander_daily_logs")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("treatment_id", treatmentId)
    .eq("log_date", today)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export function calculateProgress(
  treatment: ExpanderTreatment,
  logs: ExpanderDailyLog[]
): TreatmentProgress {
  const totalDays = treatment.total_days;

  // Only completed turns count — missed/skipped/pending do not reduce the target.
  const completedDays = logs.filter((l) => l.status === "done").length;
  const remainingDays = Math.max(totalDays - completedDays, 0);
  const progressPercentage =
    totalDays > 0
      ? Math.min(100, Math.round((completedDays / totalDays) * 100))
      : 0;
  const isComplete = completedDays >= totalDays;

  let estimatedEndDate: string | null = null;
  if (!isComplete) {
    // Estimate: complete one turn per calendar day from today, no future misses.
    estimatedEndDate = addDays(todayISO(), remainingDays);
  }

  return {
    totalDays,
    completedDays,
    remainingDays,
    progressPercentage,
    isComplete,
    nextTreatmentDayNumber: completedDays + 1,
    estimatedEndDate,
  };
}

/**
 * Returns a Map from log ID to its 1-based completed-treatment-turn number,
 * for every log with status "done" ordered by log_date ascending.
 * Used by UI components to display "Treatment Day X" accurately.
 */
export function buildCompletedTurnMap(
  logs: ExpanderDailyLog[]
): Map<string, number> {
  const doneLogs = [...logs]
    .filter((l) => l.status === "done")
    .sort((a, b) => (a.log_date < b.log_date ? -1 : 1));
  const map = new Map<string, number>();
  doneLogs.forEach((l, i) => map.set(l.id, i + 1));
  return map;
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function getAppointments(
  treatmentId: string
): Promise<DentistAppointment[]> {
  const { data, error } = await getSupabase()
    .from("dentist_appointments")
    .select("*")
    .eq("treatment_id", treatmentId)
    .order("appointment_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAppointmentById(
  id: string
): Promise<DentistAppointment | null> {
  const { data, error } = await getSupabase()
    .from("dentist_appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createAppointment(
  input: Omit<DentistAppointment, "id" | "created_at" | "updated_at">
): Promise<DentistAppointment> {
  const { data, error } = await getSupabase()
    .from("dentist_appointments")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAppointment(
  id: string,
  updates: Partial<Omit<DentistAppointment, "id" | "created_at" | "updated_at">>
): Promise<DentistAppointment> {
  const { data, error } = await getSupabase()
    .from("dentist_appointments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("dentist_appointments")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function getNextAppointment(
  treatmentId: string
): Promise<DentistAppointment | null> {
  const today = todayISO();
  const { data, error } = await getSupabase()
    .from("dentist_appointments")
    .select("*")
    .eq("treatment_id", treatmentId)
    .gte("appointment_date", today)
    .order("appointment_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
