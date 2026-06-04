"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { ExpanderTreatment, DentistAppointment } from "@/types/expander";
import { getActiveTreatment, getAppointments } from "@/lib/expander";
import AppointmentList from "@/components/AppointmentList";
import EmptyState from "@/components/EmptyState";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-9 h-9 border-[3px] border-violet-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

export default function AppointmentsPage() {
  const [treatment, setTreatment] = useState<ExpanderTreatment | null>(null);
  const [appointments, setAppointments] = useState<DentistAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const t = await getActiveTreatment();
        setTreatment(t);
        if (t) {
          const appts = await getAppointments(t.id);
          setAppointments(appts);
        }
      } catch {
        setError("Could not load visits.");
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
        description="Create a treatment first to track dentist visits."
        actionLabel="Create treatment"
        actionHref="/treatment/new"
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-800">Dentist visits 🩺</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Important dates for {treatment.child_name}
          </p>
        </div>
        <Link
          href="/appointments/new"
          className="flex items-center gap-1.5 text-white text-sm font-bold rounded-2xl px-4 py-2.5 shadow-md transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
        >
          <Plus size={15} />
          Add visit
        </Link>
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          title="No dentist visits yet"
          description="Add the next appointment so it's easy to remember."
          actionLabel="Add a visit"
          actionHref="/appointments/new"
        />
      ) : (
        <AppointmentList appointments={appointments} />
      )}
    </div>
  );
}
