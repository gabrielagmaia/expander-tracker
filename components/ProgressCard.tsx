import { Sparkles } from "lucide-react";
import type { TreatmentProgress } from "@/types/expander";
import { formatDateLong } from "@/lib/dateUtils";

interface ProgressCardProps {
  childName: string;
  progress: TreatmentProgress;
}

function encouragement(pct: number): string {
  if (pct >= 100) return "Treatment complete! Amazing work! 🎉";
  if (pct >= 75) return "Almost there — you're doing amazing! 🌟";
  if (pct >= 50) return "Halfway through — keep going! 💜";
  if (pct >= 25) return "Great start! Little steps, big progress.";
  return "Every day counts. You've got this! 🌸";
}

export default function ProgressCard({
  childName,
  progress,
}: ProgressCardProps) {
  const {
    totalDays,
    completedDays,
    remainingDays,
    progressPercentage,
    estimatedEndDate,
  } = progress;

  return (
    <div className="bg-white rounded-3xl shadow-sm p-5" style={{ border: "1.5px solid #EDE9FE" }}>
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#EDE9FE" }}
        >
          <Sparkles size={15} className="text-violet-600" />
        </div>
        <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
          Smile progress
        </h2>
      </div>

      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-slate-400 text-xs mb-0.5">Tracking for</p>
          <p className="font-bold text-slate-800 text-xl leading-tight">{childName}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs mb-0.5">Completed</p>
          <p className="font-black text-violet-600 text-3xl leading-none">
            {completedDays}
            <span className="text-slate-300 text-lg font-semibold">/{totalDays}</span>
          </p>
        </div>
      </div>

      <div className="mb-3">
        <div
          className="h-4 rounded-full overflow-hidden"
          style={{ backgroundColor: "#EDE9FE" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPercentage}%`,
              background: "linear-gradient(90deg, #8B5CF6, #A78BFA)",
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-xs">
          <span className="font-semibold text-slate-700">{remainingDays}</span> days remaining
          {" · "}
          <span className="font-semibold text-slate-700">{totalDays}</span> total
        </p>
        <p className="font-bold text-violet-600 text-sm">{progressPercentage}%</p>
      </div>

      {estimatedEndDate && remainingDays > 0 && (
        <p className="mt-2 text-slate-400 text-xs">
          Estimated completion:{" "}
          <span className="font-semibold text-slate-600">
            {formatDateLong(estimatedEndDate)}
          </span>
        </p>
      )}

      <p className="mt-3 text-xs text-slate-500 italic">
        {encouragement(progressPercentage)}
      </p>
    </div>
  );
}
