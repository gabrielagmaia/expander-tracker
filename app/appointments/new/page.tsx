"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { ExpanderTreatment } from "@/types/expander";
import { getActiveTreatment } from "@/lib/expander";
import AppointmentForm from "@/components/AppointmentForm";
import EmptyState from "@/components/EmptyState";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-9 h-9 border-[3px] border-violet-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [treatment, setTreatment] = useState<ExpanderTreatment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveTreatment().then(setTreatment).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  if (!treatment) {
    return (
      <EmptyState
        title="No treatment yet"
        description="Create a treatment first."
        actionLabel="Create treatment"
        actionHref="/treatments/new"
      />
    );
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-violet-500 text-sm mb-5 hover:text-violet-700 transition-colors"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-800">Add a visit 📅</h1>
        <p className="text-slate-400 text-sm mt-1">
          Keep track of all your dentist appointments in one place.
        </p>
      </div>

      <AppointmentForm treatmentId={treatment.id} />
    </div>
  );
}
