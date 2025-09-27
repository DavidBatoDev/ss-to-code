"use client";

// Speedrun-style progress HUD: live timer, splits, chars/sec, personal best.

export const SPLITS = [
  { key: "read", label: "Reading pixels", test: (c: string) => c.length > 0 },
  { key: "head", label: "Scaffold & head", test: (c: string) => /<body/i.test(c) },
  { key: "layout", label: "Layout blocks", test: (c: string) => (c.match(/<(div|section|header|nav|main)/gi)?.length ?? 0) >= 8 },
  { key: "content", label: "Content & styling", test: (c: string) => c.length > 3500 },
  { key: "finish", label: "Final polish", test: () => false }, // set when the stream ends
] as const;

export type SplitTimes = (number | null)[];

const PB_KEY = "pixel2code:pb";

export function loadPB(model = ""): SplitTimes | null {
  try {
    const raw = localStorage.getItem(`${PB_KEY}:${model}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePBIfBetter(splits: SplitTimes, model = ""): boolean {
  const total = splits[splits.length - 1];
  if (total == null) return false;
  const pb = loadPB(model);
  const pbTotal = pb?.[pb.length - 1];
  if (pbTotal != null && pbTotal <= total) return false;
  try {
    localStorage.setItem(`${PB_KEY}:${model}`, JSON.stringify(splits));
  } catch {}
  return true;
}

export const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(2).padStart(5, "0");
  return m ? `${m}:${sec}` : sec;
};

export function SpeedrunHUD({
  elapsed,
  splits,
  pb,
  chars,
  compact = false,
  title = "Speedrun",
}: {
  title?: string;
  elapsed: number;
  splits: SplitTimes;
  pb: SplitTimes | null;
  chars: number;
  compact?: boolean;
}) {
  const current = splits.findIndex((t) => t == null);
  const cps = elapsed > 0.5 ? Math.round(chars / elapsed) : 0;
  const pbTotal = pb?.[pb.length - 1];
  const live = pb && current >= 0 ? pb[current] : null;
  const ahead = live != null ? elapsed <= live : null;

  return (
    <div className={`w-full rounded-3xl bg-ink text-white shadow-2xl ring-1 ring-white/10 ${compact ? "max-w-xs p-4" : "max-w-sm p-6"} animate-pop`}>
      {/* timer */}
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">{title}</span>
        {pbTotal != null && <span className="text-xs text-white/50">PB {fmt(pbTotal)}</span>}
      </div>
      <div
        className={`font-mono font-bold tabular-nums ${compact ? "text-4xl" : "text-6xl"} ${
          ahead === null ? "text-white" : ahead ? "text-lime" : "text-rose-300"
        }`}
      >
        {fmt(elapsed)}
      </div>

      {/* speedometer */}
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-cyan transition-all duration-200" style={{ width: `${Math.min(100, (cps / 400) * 100)}%` }} />
        </div>
        <span className="font-mono text-xs tabular-nums text-cyan">{cps} ch/s</span>
      </div>

      {/* splits */}
      <ol className="mt-4 space-y-1.5">
        {SPLITS.map((s, i) => {
          const t = splits[i];
          const pbT = pb?.[i] ?? null;
          const delta = t != null && pbT != null ? t - pbT : null;
          const isCurrent = i === current;
          return (
            <li
              key={s.key}
              className={`flex items-center gap-3 rounded-xl px-3 py-1.5 text-sm transition ${
                isCurrent ? "bg-white/10" : ""
              } ${t == null && !isCurrent ? "text-white/40" : ""}`}
            >
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                  t != null ? "bg-lime text-ink" : isCurrent ? "border-2 border-cyan" : "border border-white/20"
                }`}
              >
                {t != null ? "✓" : isCurrent ? <span className="h-1.5 w-1.5 animate-ping rounded-full bg-cyan" /> : i + 1}
              </span>
              <span className="flex-1 truncate">{s.label}</span>
              {delta != null && (
                <span className={`font-mono text-xs tabular-nums ${delta <= 0 ? "text-lime" : "text-rose-300"}`}>
                  {delta <= 0 ? "−" : "+"}
                  {Math.abs(delta).toFixed(1)}
                </span>
              )}
              <span className="w-14 text-right font-mono text-xs tabular-nums text-white/70">{t != null ? fmt(t) : isCurrent ? "…" : "—"}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export type RaceLane = { model: string; chars: number; elapsed: number; done: boolean; failed: boolean; split: number };

const MEDALS = ["🥇", "🥈", "🥉"];

// Multi-model leaderboard shown when several models race on the same screenshot.
export function RaceHUD({ lanes, active, onPick }: { lanes: RaceLane[]; active: string; onPick: (m: string) => void }) {
  const finishers = lanes.filter((l) => l.done && !l.failed).sort((a, b) => a.elapsed - b.elapsed).map((l) => l.model);
  const maxChars = Math.max(1, ...lanes.map((l) => l.chars));
  return (
    <div className="w-full max-w-md rounded-3xl bg-ink p-5 text-white shadow-2xl ring-1 ring-white/10 animate-pop">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Model race</span>
        <span className="text-xs text-white/50">{finishers.length}/{lanes.length} finished</span>
      </div>
      <ol className="space-y-2">
        {lanes.map((l) => {
          const place = finishers.indexOf(l.model);
          return (
            <li key={l.model}>
              <button
                onClick={() => onPick(l.model)}
                className={`w-full rounded-xl px-3 py-2 text-left transition ${l.model === active ? "bg-white/10 ring-1 ring-cyan/50" : "hover:bg-white/5"}`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-center">
                    {l.failed ? "✕" : place >= 0 ? MEDALS[place] ?? `#${place + 1}` : <span className="inline-block h-2 w-2 animate-ping rounded-full bg-cyan" />}
                  </span>
                  <span className="flex-1 truncate font-mono font-semibold">{l.model}</span>
                  <span className="font-mono text-xs text-white/50">{l.done ? "" : SPLITS[Math.min(l.split, SPLITS.length - 1)].label}</span>
                  <span className={`w-14 text-right font-mono text-xs tabular-nums ${l.done && !l.failed ? "text-lime" : l.failed ? "text-rose-300" : "text-white/80"}`}>
                    {fmt(l.elapsed)}
                  </span>
                </div>
                <div className="ml-8 mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${l.failed ? "bg-rose-400" : l.done ? "bg-lime" : "bg-cyan"}`}
                    style={{ width: `${l.done ? 100 : Math.max(3, (l.chars / maxChars) * 90)}%` }}
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
