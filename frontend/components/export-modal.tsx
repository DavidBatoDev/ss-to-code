"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/modal";
import { withCapture } from "@/lib/preview";

type Preset = { id: string; label: string; hint: string; w: number; h: number | "full"; ratio: [number, number] | null; out: number };

// `w`/`h` = the viewport the page is laid out in; `out` = target output width in px.
const PRESETS: Preset[] = [
  { id: "16:9", label: "16:9", hint: "Desktop · slides", w: 1440, h: 810, ratio: [16, 9], out: 1920 },
  { id: "4:3", label: "4:3", hint: "Classic", w: 1280, h: 960, ratio: [4, 3], out: 1600 },
  { id: "1:1", label: "1:1", hint: "Square post", w: 1080, h: 1080, ratio: [1, 1], out: 1080 },
  { id: "4:5", label: "4:5", hint: "Instagram", w: 1080, h: 1350, ratio: [4, 5], out: 1080 },
  { id: "9:16", label: "9:16", hint: "Mobile · story", w: 390, h: 693, ratio: [9, 16], out: 1080 },
  { id: "full", label: "Full page", hint: "Entire scroll height", w: 1440, h: "full", ratio: null, out: 1440 },
];

type Result = { url: string; w: number; h: number; bytes: number };

export function ExportModal({ open, onClose, code, name }: { open: boolean; onClose: () => void; code: string; name: string }) {
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [format, setFormat] = useState<"png" | "jpg">("png");
  const [quality, setQuality] = useState(0.92);
  const [hiDpi, setHiDpi] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frame, setFrame] = useState<{ id: string; html: string; w: number; h: number } | null>(null);
  const reqId = useRef("");

  const render = useCallback(() => {
    const id = Math.random().toString(36).slice(2);
    reqId.current = id;
    const base = preset.out / preset.w;
    const scale = Math.min(4, base * (hiDpi ? 1.5 : 1));
    setBusy(true);
    setError(null);
    setResult(null);
    const vh = preset.h === "full" ? 900 : preset.h;
    setFrame({
      id,
      w: preset.w,
      h: vh,
      html: withCapture(code, {
        id,
        width: preset.w,
        height: preset.h,
        scale: Number(scale.toFixed(3)),
        type: format === "png" ? "image/png" : "image/jpeg",
        quality,
      }),
    });
  }, [code, preset, format, quality, hiDpi]);

  // Re-render the preview whenever options change while open.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(render, 250);
    return () => clearTimeout(t);
  }, [open, render]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.p2c !== "capture" || d.id !== reqId.current) return;
      setBusy(false);
      setFrame(null);
      if (!d.ok) return setError(d.error || "Rendering failed");
      setResult({ url: d.url, w: d.w, h: d.h, bytes: Math.round((d.url.length * 3) / 4) });
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    if (!open) {
      setResult(null);
      setFrame(null);
      setBusy(false);
    }
  }, [open]);

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = `${name}-${preset.id.replace(":", "x")}.${format}`;
    a.click();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Export image"
      subtitle="Render your generated page as a PNG or JPG in any aspect ratio."
      footer={
        <>
          {result && (
            <span className="mr-auto font-mono text-xs text-white/45">
              {result.w}×{result.h} · {(result.bytes / 1024).toFixed(0)} KB
            </span>
          )}
          <button onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10">
            Cancel
          </button>
          <button
            onClick={download}
            disabled={!result || busy}
            className="rounded-full bg-cyan px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-40"
          >
            Download .{format}
          </button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        {/* Options */}
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">Aspect ratio</p>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => {
                const [rw, rh] = p.ratio ?? [3, 5];
                const box = 28;
                const w = rw >= rh ? box : (box * rw) / rh;
                const h = rh >= rw ? box : (box * rh) / rw;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition ${
                      preset.id === p.id ? "border-cyan bg-cyan/10" : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <span className="grid h-8 place-items-center">
                      <span
                        className={`block rounded-[4px] border-2 ${preset.id === p.id ? "border-cyan" : "border-white/40"} ${p.ratio ? "" : "border-dashed"}`}
                        style={{ width: w, height: h }}
                      />
                    </span>
                    <span className="text-sm font-semibold text-white">{p.label}</span>
                    <span className="-mt-1.5 text-[11px] text-white/45">{p.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">Format</p>
            <div className="grid grid-cols-2 rounded-full bg-white/5 p-1 text-sm ring-1 ring-white/10">
              {(["png", "jpg"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`rounded-full py-1.5 font-semibold uppercase transition ${format === f ? "bg-white text-ink" : "text-white/55"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            {format === "jpg" && (
              <label className="mt-3 block text-xs text-white/55">
                <span className="flex justify-between">
                  Quality <span className="font-mono text-white/80">{Math.round(quality * 100)}%</span>
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.01}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="mt-2 w-full accent-[#75d8ee]"
                />
              </label>
            )}
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm">
            <span>
              <span className="block font-semibold text-white">High resolution</span>
              <span className="text-xs text-white/45">1.5× sharper, larger file</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={hiDpi}
              onClick={() => setHiDpi((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition ${hiDpi ? "bg-cyan" : "bg-white/15"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${hiDpi ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </label>
        </div>

        {/* Preview */}
        <div className="grid-bg flex min-h-[340px] items-center justify-center rounded-2xl bg-ink p-4 ring-1 ring-white/10">
          {busy ? (
            <div className="flex flex-col items-center gap-3 text-sm text-white/60">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-cyan" />
              Rendering {preset.label}…
            </div>
          ) : error ? (
            <div className="max-w-xs text-center text-sm">
              <p className="font-semibold text-rose-300">Couldn&apos;t render the image</p>
              <p className="mt-1 text-white/50">{error}</p>
              <button onClick={render} className="mt-3 rounded-full border border-white/15 px-4 py-1.5 text-white/80 hover:border-cyan">
                Try again
              </button>
            </div>
          ) : result ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.url} alt="Export preview" className="max-h-[52vh] max-w-full rounded-lg shadow-2xl ring-1 ring-white/10 animate-pop" />
          ) : null}
        </div>
      </div>

      {/* Off-screen renderer */}
      {frame && (
        <iframe
          key={frame.id}
          title="export-renderer"
          srcDoc={frame.html}
          sandbox="allow-scripts"
          aria-hidden
          tabIndex={-1}
          style={{ position: "fixed", left: -10000, top: 0, width: frame.w, height: frame.h, border: 0, opacity: 0, pointerEvents: "none" }}
        />
      )}
    </Modal>
  );
}
