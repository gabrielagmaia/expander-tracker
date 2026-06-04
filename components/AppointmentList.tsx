import Link from "next/link";
import { CalendarDays, MapPin, User } from "lucide-react";
import type { DentistAppointment } from "@/types/expander";
import { formatDateLong, todayISO } from "@/lib/dateUtils";

const typeLabels: Record<string, string> = {
  installation: "Installation",
  follow_up: "Follow-up",
  adjustment: "Adjustment",
  emergency: "Emergency",
  final_check: "Final check",
  other: "Other",
};

const typeEmoji: Record<string, string> = {
  installation: "🔧",
  follow_up: "🩺",
  adjustment: "⚙️",
  emergency: "🚨",
  final_check: "🎉",
  other: "📋",
};

interface AppointmentListProps {
  appointments: DentistAppointment[];
  showSection?: boolean;
}

function AppointmentCard({ appt }: { appt: DentistAppointment }) {
  return (
    <div
      className="bg-white rounded-2xl px-4 py-4 shadow-sm"
      style={{ border: "1.5px solid #EDE9FE" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">
              {appt.appointment_type
                ? (typeEmoji[appt.appointment_type] ?? "📋")
                : "📅"}
            </span>
            <p className="text-slate-800 font-semibold text-sm">
              {formatDateLong(appt.appointment_date)}
              {appt.appointment_time && (
                <span className="text-slate-400 font-normal">
                  {" "}at {appt.appointment_time}
                </span>
              )}
            </p>
          </div>

          {appt.provider_name && (
            <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
              <User size={11} />
              {appt.provider_name}
            </p>
          )}
          {appt.location && (
            <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
              <MapPin size={11} />
              {appt.location}
            </p>
          )}
          {appt.dentist_instructions && (
            <p
              className="text-violet-700 text-xs mt-2 italic rounded-xl px-3 py-2"
              style={{ backgroundColor: "#EDE9FE" }}
            >
              &ldquo;{appt.dentist_instructions}&rdquo;
            </p>
          )}
        </div>

        {appt.appointment_type && (
          <span
            className="flex-shrink-0 text-xs font-semibold rounded-full px-2.5 py-1 text-violet-700"
            style={{ backgroundColor: "#EDE9FE" }}
          >
            {typeLabels[appt.appointment_type] ?? appt.appointment_type}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AppointmentList({
  appointments,
  showSection = true,
}: AppointmentListProps) {
  const today = todayISO();
  const upcoming = appointments.filter((a) => a.appointment_date >= today);
  const past = appointments.filter((a) => a.appointment_date < today);

  if (appointments.length === 0) {
    return (
      <p className="text-slate-400 text-sm text-center py-6 italic">
        No dentist visits yet. Add the next appointment so it&apos;s easy to remember.
      </p>
    );
  }

  if (!showSection) {
    return (
      <div className="flex flex-col gap-2">
        {appointments.map((a) => (
          <AppointmentCard key={a.id} appt={a} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-slate-500 font-semibold text-xs uppercase tracking-wide mb-3">
            Upcoming visits
          </h3>
          <div className="flex flex-col gap-2">
            {upcoming.map((a) => (
              <AppointmentCard key={a.id} appt={a} />
            ))}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wide mb-3">
            Past visits
          </h3>
          <div className="flex flex-col gap-2 opacity-70">
            {past.map((a) => (
              <AppointmentCard key={a.id} appt={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function NextAppointmentBanner({ appt }: { appt: DentistAppointment }) {
  return (
    <div
      className="rounded-2xl px-4 py-3.5 flex items-start gap-3"
      style={{ backgroundColor: "#EDE9FE", border: "1.5px solid #DDD6FE" }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "#DDD6FE" }}
      >
        <CalendarDays size={17} className="text-violet-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-violet-600 text-xs font-bold uppercase tracking-wide">
          Next dentist visit
        </p>
        <p className="text-violet-900 font-semibold text-sm mt-0.5">
          {formatDateLong(appt.appointment_date)}
          {appt.appointment_time && <span className="font-normal"> at {appt.appointment_time}</span>}
        </p>
        {appt.provider_name && (
          <p className="text-violet-600 text-xs mt-0.5">{appt.provider_name}</p>
        )}
      </div>
      <Link
        href="/appointments"
        className="text-violet-500 text-xs underline flex-shrink-0 mt-0.5"
      >
        All visits
      </Link>
    </div>
  );
}
