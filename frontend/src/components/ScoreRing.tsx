// The customer app's score ring (mobile-app/src/components/ui.tsx) as plain SVG:
// soft tier bands, the current score in blue, the projected gain in light blue.

import { bandSoft } from "./Bands";

const tierSoft = bandSoft.slice(0, 4);

export function ScoreRing({ score, projected, max, tierMins, size = 220 }: { score: number; projected: number; max: number; tierMins: number[]; size?: number }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / max));
  const projectedPct = Math.max(pct, Math.min(1, projected / max));
  const center = size / 2;
  const mins = [...tierMins].sort((a, b) => a - b);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Care Score ${score}${projected > score ? ` → ${projected}` : ""}`}>
        <g transform={`rotate(-90 ${center} ${center})`}>
          {mins.map((start, i) => {
            const from = i === 0 ? 0 : start;
            const end = mins[i + 1] ?? max;
            return (
              <circle key={start} cx={center} cy={center} r={r} fill="none" strokeWidth={10} stroke={tierSoft[i % tierSoft.length]}
                strokeDasharray={`${c * ((end - from) / max)} ${c}`} strokeDashoffset={-c * (from / max)} />
            );
          })}
          <circle cx={center} cy={center} r={r} fill="none" strokeWidth={10} strokeLinecap="round" stroke="var(--primary)"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="motion-safe:transition-all motion-safe:duration-1000" />
          {projectedPct > pct && (
            <circle cx={center} cy={center} r={r} fill="none" strokeWidth={10} stroke="var(--primary-light)"
              strokeDasharray={`${c * (projectedPct - pct)} ${c}`} strokeDashoffset={-c * pct} className="motion-safe:transition-all motion-safe:duration-700" />
          )}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-[3.25rem] leading-none font-light tabular-nums ${projected > score ? "text-primary-light" : ""}`}>{projected}</span>
        {projected > score && <span className="mt-1 text-base font-medium text-primary tabular-nums">+{projected - score}</span>}
        <span className="mt-1 text-sm text-muted-foreground">Care Score</span>
      </div>
    </div>
  );
}
