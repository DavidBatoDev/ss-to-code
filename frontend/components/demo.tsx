"use client";

import { useEffect, useState } from "react";

// Auto-playing product demo: upload → scan → code streams → live preview.
const STAGES = ["Upload", "Scan", "Generate", "Preview"] as const;
const CODE = `<nav class="flex justify-between p-4">
  <b class="text-xl">Brewly</b>
  <button class="rounded-full bg-ink px-4">Order</button>
</nav>
<section class="grid md:grid-cols-2 gap-8 p-8">
  <h1 class="text-5xl font-bold">Coffee, done right.</h1>
  <img src="beans.png" class="rounded-3xl" />
</section>
<div class="grid grid-cols-3 gap-4 p-8">
  <Card title="Espresso" price="$3" />
  <Card title="Latte" price="$4" />
  <Card title="Cold brew" price="$5" />
</div>`;

export function LiveDemo() {
  const [stage, setStage] = useState(0);
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    const durations = [1800, 2200, 4200, 3600];
    const t = setTimeout(() => {
      setStage((s) => (s + 1) % STAGES.length);
      setTyped(0);
    }, durations[stage]);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== 2) return;
    const t = setInterval(() => setTyped((n) => Math.min(CODE.length, n + 6)), 16);
    return () => clearInterval(t);
  }, [stage]);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-panel shadow-2xl">
      {/* window bar */}
      <div className="flex items-center gap-4 border-b border-white/10 px-5 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-blue/60" />
          <span className="h-3 w-3 rounded-full bg-lime" />
          <span className="h-3 w-3 rounded-full bg-teal/60" />
        </div>
        <div className="flex flex-1 justify-center gap-1">
          {STAGES.map((s, i) => (
            <button
              key={s}
              onClick={() => {
                setStage(i);
                setTyped(i === 2 ? 0 : CODE.length);
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                i === stage ? "bg-cyan text-ink" : i < stage ? "bg-mist text-cyan" : "text-white/40"
              }`}
            >
              {i < stage ? "✓ " : ""}
              {s}
            </button>
          ))}
        </div>
        <span className="hidden font-mono text-xs text-white/40 sm:block">pixel2code.app/studio</span>
      </div>

      <div className="grid min-h-[380px] md:grid-cols-[1fr_1.3fr]">
        {/* left: the screenshot */}
        <div className="relative flex items-center justify-center bg-mist p-6">
          <div
            className={`relative w-full max-w-[260px] overflow-hidden rounded-xl border border-white/10 bg-panel p-3 shadow-lg transition-all duration-700 ${
              stage === 0 ? "translate-y-0 opacity-100 animate-float" : ""
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="h-3 w-14 rounded bg-white/80" />
              <div className="h-4 w-10 rounded-full bg-cyan" />
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded bg-white/15" />
                <div className="h-3 w-4/5 rounded bg-white/15" />
                <div className="h-2 w-3/5 rounded bg-white/10" />
              </div>
              <div className="h-16 rounded-lg bg-lime/60" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 rounded-md border border-white/10" />
              ))}
            </div>
            {stage === 1 && <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-cyan/40 animate-scan" />}
            {stage === 1 &&
              [
                "left-2 top-2 h-6 w-[90%]",
                "left-2 top-11 h-[4.5rem] w-[45%]",
                "right-2 top-11 h-[4.5rem] w-[45%]",
                "left-2 bottom-2 h-11 w-[90%]",
              ].map((c, i) => (
                <div key={c} className={`absolute rounded-md border-2 border-teal animate-pop ${c}`} style={{ animationDelay: `${i * 0.35}s` }} />
              ))}
          </div>
          {stage === 0 && (
            <div className="absolute bottom-5 rounded-full bg-cyan px-4 py-1.5 text-xs font-semibold text-ink shadow animate-pop">
              📸 screenshot.png dropped
            </div>
          )}
          {stage === 1 && (
            <div className="absolute bottom-5 rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-cyan shadow animate-pop">
              Detecting 4 layout regions…
            </div>
          )}
        </div>

        {/* right: code or preview */}
        <div className="relative bg-ink p-5">
          {stage < 3 ? (
            <pre className="h-full whitespace-pre-wrap font-mono text-[12px] leading-5 text-cyan/90">
              {stage === 2 ? CODE.slice(0, typed) : stage > 2 ? CODE : ""}
              {stage === 2 && <span className="animate-blink text-lime">▌</span>}
              {stage < 2 && <span className="text-white/30">{"// waiting for pixels…"}</span>}
            </pre>
          ) : (
            <div className="h-full rounded-xl bg-white p-4 text-ink animate-pop">
              <div className="mb-4 flex items-center justify-between">
                <b className="text-lg">Brewly</b>
                <span className="rounded-full bg-cyan px-3 py-1 text-xs text-ink">Order</span>
              </div>
              <div className="mb-4 grid grid-cols-2 items-center gap-4">
                <h3 className="font-display text-2xl font-extrabold leading-tight">Coffee, done right.</h3>
                <div className="grid h-20 place-items-center rounded-2xl bg-lime/60 text-3xl">☕</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  ["Espresso", "$3"],
                  ["Latte", "$4"],
                  ["Cold brew", "$5"],
                ].map(([n, p]) => (
                  <div key={n} className="rounded-lg border border-white/10 p-2">
                    <div className="font-semibold">{n}</div>
                    <div className="text-cyan">{p}</div>
                  </div>
                ))}
              </div>
              <div className="absolute right-8 top-8 rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink shadow animate-pop">
                ✓ Rendered in 8.2s
              </div>
            </div>
          )}
          {stage === 2 && (
            <div className="absolute bottom-4 right-4 h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-teal transition-all" style={{ width: `${(typed / CODE.length) * 100}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
