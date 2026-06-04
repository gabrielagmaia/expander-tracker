import { getSupabase } from "./supabaseClient";
import {
  currentTreatmentDay,
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
  updates: Partial<Omit<ExpanderTreatment, "id" | "created_at" | "updated_at">>,
  previousTotalDays?: number
): Promise<ExpanderTreatment> {
  const { data, error } = await getSupabase()
    .from("expander_treatments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  if (
    updates.total_days !== undefined &&
    previousTotalDays !== undefined &&
    updates.total_days > previousTotalDays
  ) {
    await extendDailyLogs(
      id,
      data.start_date,
      previousTotalDays,
      updates.total_days
    );
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
    .upsert(logs, { onConflict: "treatment_id,day_number", ignoreDuplicates: true });
  if (error) throw error;
}

export async function extendDailyLogs(
  treatmentId: string,
  startDate: string,
  previousTotal: number,
  newTotal: number
): Promise<void> {
  const logs = Array.from(
    { length: newTotal - previousTotal },
    (_, i) => {
      const dayNumber = previousTotal + i + 1;
      return {
        treatment_id: treatmentId,
        day_number: dayNumber,
        log_date: logDateForDay(startDate, dayNumber),
        status: "pending" as const,
      };
    }
  );

  if (logs.length === 0) return;

  const { error } = await getSupabase()
    .from("expander_daily_logs")
    .upsert(logs, { onConflict: "treatment_id,day_number", ignoreDuplicates: true });
  if (error) throw error;
}

export async function getDailyLogs(
  treatmentId: string
): Promise<ExpanderDailyLog[]> {
  const { data, error } = await getSupabase()
    .from("expander_daily_logs")
    .select("*")
    .eq("treatment_id", treatmentId)
    .order("day_number", { ascending: true });
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
  const currentDay = currentTreatmentDay(treatment.start_date);
  const totalDays = treatment.total_days;

  const completedDays = logs.filter(
    (l) => l.status === "done" && l.day_number <= totalDays
  ).length;

  const progressPercentage =
    totalDays > 0
      ? Math.min(100, Math.round((completedDays / totalDays) * 100))
      : 0;

  return {
    currentDay: currentDay ?? 0,
    totalDays,
    completedDays,
    progressPercentage,
    isComplete: completedDays >= totalDays,
  };
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
