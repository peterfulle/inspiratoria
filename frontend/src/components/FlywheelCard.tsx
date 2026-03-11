import { ReactNode } from "react";
import clsx from "clsx";

interface FlywheelCardProps {
  label: string;
  title: string;
  description: string;
  accent: "match" | "momentum" | "measure";
  children?: ReactNode;
}

const accentMap: Record<FlywheelCardProps["accent"], string> = {
  match: "from-primary-400/80",
  momentum: "from-green-400/70",
  measure: "from-purple-400/70",
};

export function FlywheelCard({ label, title, description, accent, children }: FlywheelCardProps) {
  return (
    <div
      className={clsx(
        "relative flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/40 p-8 shadow-card",
        "before:absolute before:inset-x-6 before:top-0 before:h-1 before:rounded-full",
        "before:bg-gradient-to-r",
        accentMap[accent]
      )}
    >
      <p className="text-sm uppercase tracking-[0.3em] text-white/70">{label}</p>
      <h3 className="text-2xl font-semibold text-white">{title}</h3>
      <p className="text-base text-white/80">{description}</p>
      {children}
    </div>
  );
}
