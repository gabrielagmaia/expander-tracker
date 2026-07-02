export type TreatmentStatus = "active" | "completed" | "paused" | "cancelled";

export type DailyLogStatus =
  | "pending"
  | "done"
  | "missed"
  | "skipped_by_dentist";

export type AppointmentType =
  | "installation"
  | "follow_up"
  | "adjustment"
  | "emergency"
  | "final_check"
  | "other";

export interface ExpanderTreatment {
  id: string;
  child_name: string;
  start_date: string; // ISO date string YYYY-MM-DD
  total_days: number;
  turns_per_day: number;
  reminder_time: string | null; // HH:MM
  status: TreatmentStatus;
  notes: string | null;
  completed_at: string | null; // ISO timestamp — set when status transitions to 'completed'
  created_at: string;
  updated_at: string;
}

export interface ExpanderDailyLog {
  id: string;
  treatment_id: string;
  day_number: number;
  log_date: string; // ISO date string YYYY-MM-DD
  status: DailyLogStatus;
  completed_at: string | null;
  discomfort_level: number | null; // 1-5
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DentistAppointment {
  id: string;
  treatment_id: string;
  appointment_date: string; // ISO date string YYYY-MM-DD
  appointment_time: string | null; // HH:MM
  provider_name: string | null;
  location: string | null;
  appointment_type: AppointmentType | null;
  notes: string | null;
  dentist_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreatmentProgress {
  totalDays: number;
  completedDays: number;
  remainingDays: number;
  progressPercentage: number;
  isComplete: boolean;
  /** 1-based index of the next turn to complete (completedDays + 1). */
  nextTreatmentDayNumber: number;
  /** YYYY-MM-DD estimate assuming no future misses; null when treatment is complete. */
  estimatedEndDate: string | null;
}

/** Which of the three dashboard states to render. */
export type DashboardState = "active" | "has_history" | "empty";
