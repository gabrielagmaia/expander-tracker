"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, ListChecks, Settings } from "lucide-react";
import ExpanderIcon from "./ExpanderIcon";

const navLinks = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/days", label: "Days", Icon: ListChecks },
  { href: "/appointments", label: "Visits", Icon: CalendarDays },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-white sticky top-0 z-10" style={{ borderBottom: "2px solid #EDE9FE" }}>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <ExpanderIcon size={28} />
            <span className="font-bold text-violet-700 text-base tracking-tight">
              Expander Tracker
            </span>
          </Link>
          <nav className="flex gap-0.5">
            {navLinks.map(({ href, label, Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    active
                      ? "bg-violet-100 text-violet-700"
                      : "text-slate-400 hover:text-violet-500 hover:bg-violet-50"
                  }`}
                >
                  <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
