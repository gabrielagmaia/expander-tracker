import { getSupabase } from "./supabaseClient";
import {
  addDays,
  dayNumberForDate,
  logDateForDay,
  todayISO,
} from "./dateUtils";
import type {
  DashboardState,
  ExpanderTreatment,
  ExpanderDailyLog,
  DentistAppointment,
  TreatmentProgress,
  TreatmentStatus,
} from "@/types/expander";

// ─── Treatments ───────────────────────────────────────────────────────────────

/** Returns the single currently-active treatment, or null if none is active. */
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

/**
 * Returns the most recently created treatment regardless of status.
 * Used by the dashboard to display a completed-treatment summary when
 * there is no active treatment.
 */
export async function getLatestTreatment(): Promise<ExpanderTreatment | null> {
  const { data, error } = await getSupabase()
    .from("expander_treatments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Returns all treatments ordered newest-first.
 * Used by the /treatments history list.
 */
export async function getAllTreatments(): Promise<ExpanderTreatment[]> {
  const { data, error } = await getSupabase()
    .from("expander_treatments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
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

/**
 * Creates a new treatment and its initial calendar logs.
 * Throws if an active treatment already exists (one active treatment at a time).
 */
export async function createTreatment(
  input: Omit<ExpanderTreatment, "id" | "created_at" | "updated_at" | "completed_at">
): Promise<ExpanderTreatment> {
  const existing = await getActiveTreatment();
  if (existing) {
    throw new Error(
      "You already have an active treatment. Complete, pause, or cancel it before starting another one."
    );
  }

  const { data, error } = await getSupabase()
    .from("expander_treatments")
    .insert({ ...input, completed_at: null })
    .select()
    .single();
  if (error) throw error;

  await generateDailyLogs(data.id, data.start_date, data.total_days);
  return data;
}

/**
 * Marks a treatment as completed and stamps completed_at.
 * Idempotent: does not overwrite completed_at if already set.
 */
export async function completeTreatment(id: string): Promise<ExpanderTreatment> {
  // Fetch first to avoid overwriting an existing completed_at
  const current = await getTreatmentById(id);
  const completedAt = current?.completed_at ?? new Date().toISOString();

  const { data, error } = await getSupabase()
    .from("expander_treatments")
    .update({
      status: "completed",
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTreatment(
  id: string,
  updates: Partial<Omit<ExpanderTreatment, "id" | "created_at" | "updated_at">>
): Promise<ExpanderTreatment> {
  // Manage completed_at automatically on status transitions.
  let payload: typeof updates = { ...updates };
  if (updates.status === "completed" && !updates.completed_at) {
    payload = { ...payload, completed_at: new Date().toISOString() };
  }
  if (updates.status === "active") {
    // Reactivating a treatment clears the completion stamp.
    payload = { ...payload, completed_at: null };
  }

  const { data, error } = await getSupabase()
    .from("expander_treatments")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  // If total_days changed and the treatment is (still) active, extend future logs.
  if (updates.total_days !== undefined && data.status === "active") {
    const logs = await getDailyLogs(id);
    await ensureActiveLogs(data, logs);
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
 * Pure gate: returns true only when new calendar logs should be generated.
 * Exported for unit testing without touching the database.
 */
export function shouldEnsureLogs(
  status: TreatmentStatus,
  completedDays: number,
  totalDays: number
): boolean {
  return status === "active" && completedDays < totalDays;
}

/**
 * Ensures calendar logs exist from start_date through (today + remainingDays)
 * so that missed or skipped days never leave the treatment without a future row.
 *
 * Returns true if any new logs were inserted (callers can re-fetch if needed).
 * Exits immediately for non-active treatments or when the target is already met.
 */
export async function ensureActiveLogs(
  treatment: ExpanderTreatment,
  existingLogs: ExpanderDailyLog[]
): Promise<boolean> {
  const completedDays = existingLogs.filter((l) => l.status === "done").length;
  if (!shouldEnsureLogs(treatment.status, completedDays, treatment.total_days)) {
    return false;
  }

  const remainingDays = treatment.total_days - completedDays;
  const today = todayISO();
  const neededThrough = addDays(today, remainingDays);

  const existingDates = new Set(existingLogs.map((l) => l.log_date));

  const logsToCreate: Array<{
    treatment_id: string;
    day_number: number;
    log_date: string;
    status: "pending";
  }> = [];

  let cursor = treatment.start_date;
  while (cursor <= neededThrough) {
    if (!existingDates.has(cursor)) {
      logsToCreate.push({
        treatment_id: treatment.id,
        day_number: dayNumberForDate(treatment.start_date, cursor),
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

/**
 * Returns a lightweight log count per treatment for the history list.
 * Fetches only treatment_id + status columns across all requested IDs
 * in a single query to avoid N+1 round-trips.
 */
export async function getLogSummariesForTreatments(
  treatmentIds: string[]
): Promise<Record<string, { completedDays: number }>> {
  if (treatmentIds.length === 0) return {};

  const { data, error } = await getSupabase()
    .from("expander_daily_logs")
    .select("treatment_id, status")
    .in("treatment_id", treatmentIds);
  if (error) throw error;

  const result: Record<string, { completedDays: number }> = {};
  for (const log of data ?? []) {
    if (!result[log.treatment_id]) result[log.treatment_id] = { completedDays: 0 };
    if (log.status === "done") result[log.treatment_id].completedDays++;
  }
  return result;
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
  if (!isComplete && treatment.status === "active") {
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

/**
 * Determines which of the three dashboard states to render.
 * Pure function — no DB calls, safe to test.
 */
export function getDashboardState(
  activeTreatment: ExpanderTreatment | null,
  latestTreatment: ExpanderTreatment | null
): DashboardState {
  if (activeTreatment) return "active";
  if (latestTreatment) return "has_history";
  return "empty";
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
