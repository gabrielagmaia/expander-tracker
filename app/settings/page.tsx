"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import type { ExpanderTreatment } from "@/types/expander";
import { getLatestTreatment } from "@/lib/expander";
import TreatmentSettingsForm from "@/components/TreatmentSettingsForm";
import EmptyState from "@/components/EmptyState";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-9 h-9 border-[3px] border-violet-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

export default function SettingsPage() {
  const [treatment, setTreatment] = useState<ExpanderTreatment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLatestTreatment()
      .then(setTreatment)
      .catch(() => setError("Could not load settings."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  if (error) {
    return <p className="text-red-400 text-sm text-center py-8">{error}</p>;
  }

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
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "#EDE9FE" }}
        >
          <Settings size={17} className="text-violet-600" />
        </div>
        <h1 className="text-xl font-black text-slate-800">Treatment settings</h1>
      </div>
      <p className="text-slate-400 text-sm mb-6 pl-11">
        Adjust the plan if your dentist changes the number of days.
      </p>

      <TreatmentSettingsForm treatment={treatment} />
    </div>
  );
}
