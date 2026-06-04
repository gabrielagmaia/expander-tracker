import { CheckCircle2, Clock, AlertCircle, Stethoscope } from "lucide-react";
import type { DailyLogStatus } from "@/types/expander";

const config: Record<
  DailyLogStatus,
  { label: string; className: string; Icon: React.ElementType }
> = {
  done: {
    label: "Done",
    className: "bg-green-100 text-green-800",
    Icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    className: "bg-sky-100 text-sky-700",
    Icon: Clock,
  },
  missed: {
    label: "Missed",
    className: "bg-orange-100 text-orange-800",
    Icon: AlertCircle,
  },
  skipped_by_dentist: {
    label: "Skipped by dentist",
    className: "bg-violet-100 text-violet-700",
    Icon: Stethoscope,
  },
};

interface StatusBadgeProps {
  status: DailyLogStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className, Icon } = config[status] ?? config.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      <Icon size={11} strokeWidth={2.5} />
      {label}
    </span>
  );
}
