import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl"
        style={{ backgroundColor: "#EDE9FE" }}
      >
        🌸
      </div>
      <h3 className="text-slate-700 font-bold text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 text-sm mb-7 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="bg-violet-600 text-white rounded-2xl px-7 py-3.5 font-semibold text-sm hover:bg-violet-700 transition-colors shadow-md"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
