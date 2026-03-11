interface MetricPillProps {
  label: string;
  value: string;
}

export function MetricPill({ label, value }: MetricPillProps) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-center text-sm text-white/80">
      <p className="text-white text-lg font-semibold">{value}</p>
      <span className="text-white/60 text-xs uppercase tracking-widest">{label}</span>
    </div>
  );
}
