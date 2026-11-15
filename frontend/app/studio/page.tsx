"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyCanvasIllustration, GeneratingIllustration, UploadIllustration } from "@/components/illustrations";
import { Logo } from "@/components/logo";
import { ExportModal } from "@/components/export-modal";
import { withZoomBridge } from "@/lib/preview";
import { createClient, type Generation } from "@/lib/supabase/client";
import { RaceHUD, SPLITS, SpeedrunHUD, fmt, loadPB, savePBIfBetter, type SplitTimes } from "@/components/speedrun";

const STACKS = [
  { id: "html", label: "HTML", dot: "bg-blue" },
  { id: "react", label: "React", dot: "bg-cyan" },
  { id: "vue", label: "Vue", dot: "bg-lime" },
];
const STYLINGS = [
  { id: "tailwind", label: "Tailwind", hint: "Utility classes" },
  { id: "css", label: "Raw CSS", hint: "Plain <style> block" },
] as const;
const EXPECTED_CHARS = 6000;
const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];

type Phase = "idle" | "thinking" | "streaming";
type Run = {
  model: string;
  code: string;
  phase: Phase;
  splits: SplitTimes;
  pb: SplitTimes | null;
  start: number;
  end: number | null;
  error: string | null;
};
type Version = { code: string; label: string; model: string };

const cleanCode = (raw: string) => raw.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/, "");

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function Studio() {
  const [image, setImage] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [framework, setFramework] = useState(STACKS[0].id);
  const [styling, setStyling] = useState<(typeof STYLINGS)[number]["id"]>("tailwind");
  const stack = `${framework}_${styling}`;
  const [models, setModels] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [runs, setRuns] = useState<Record<string, Run>>({});
  const [activeModel, setActiveModel] = useState<string>("");
  const [code, setCode] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [activeVersion, setActiveVersion] = useState<number | null>(null);
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [now, setNow] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [zoom, setZoom] = useState(1);
  const zoomStep = useCallback(
    (dir: 1 | -1) =>
      setZoom((z) => (dir > 0 ? ZOOMS.find((v) => v > z + 0.001) ?? z : [...ZOOMS].reverse().find((v) => v < z - 0.001) ?? z)),
    [],
  );

  // Ctrl/Cmd + = / - / 0 zooms the output (unless typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "=" || e.key === "+") (e.preventDefault(), zoomStep(1));
      else if (e.key === "-") (e.preventDefault(), zoomStep(-1));
      else if (e.key === "0") (e.preventDefault(), setZoom(1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomStep]);

  // Smooth, native-feeling zoom for Ctrl/⌘+wheel and trackpad pinch.
  const wheelZoom = useCallback((dy: number) => {
    setZoom((z) => Math.min(ZOOMS[ZOOMS.length - 1], Math.max(ZOOMS[0], z * Math.exp(-dy * 0.0025))));
  }, []);
  const outputRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = outputRef.current;
    if (!el) return;
    // non-passive so we can stop the browser from zooming the whole page
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      wheelZoom(e.deltaY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [wheelZoom]);
  // Same gestures coming from inside the preview iframe.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (d?.p2c === "zoom-wheel") wheelZoom(d.dy);
      else if (d?.p2c === "zoom-key") d.key === "0" ? setZoom(1) : zoomStep(d.key === "-" ? -1 : 1);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [wheelZoom, zoomStep]);
  const [exportOpen, setExportOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const supabase = useRef(createClient()).current;
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Load the signed-in user and their saved library.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    supabase
      .from("generations")
      .select("id, model, stack, label, code, duration_ms, created_at")
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data, error }) => {
        if (error) return console.warn("library load failed", error.message);
        if (data?.length) setVersions((data as Generation[]).map((g) => ({ code: g.code, label: g.label, model: g.model })));
      });
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const runList = Object.values(runs);
  const busy = runList.some((r) => r.phase !== "idle");
  const activeRun = runs[activeModel];
  const shownCode = activeRun && activeRun.phase !== "idle" ? activeRun.code : code;
  const multi = runList.length > 1;

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((d: { default: string; models: string[] }) => {
        setModels(d.models);
        setSelected([d.default]);
        setActiveModel(d.default);
      })
      .catch(() => {
        setModels(["gpt-6-luna"]);
        setSelected(["gpt-6-luna"]);
      });
  }, []);

  const loadFile = useCallback(async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("That file isn't an image.");
    if (file.size > 8 * 1024 * 1024) return setError("Image is over 8 MB — try a smaller one.");
    setError(null);
    setReading(true);
    try {
      setImage(await readFile(file));
    } finally {
      setReading(false);
    }
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      if (item) {
        e.preventDefault();
        loadFile(item.getAsFile()).then(() => flashPasted());
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadFile]);

  const [pasted, setPasted] = useState(false);
  const flashPasted = () => {
    setPasted(true);
    setTimeout(() => setPasted(false), 1200);
  };

  // "Paste image" button: reads an image straight from the system clipboard.
  const pasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.read) throw new Error("unsupported");
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (type) {
          const blob = await item.getType(type);
          await loadFile(new File([blob], `pasted.${type.split("/")[1]}`, { type }));
          flashPasted();
          return;
        }
      }
      setError("No image on your clipboard — copy a screenshot first (e.g. Win+Shift+S).");
    } catch (e) {
      setError(
        (e as Error).message === "unsupported"
          ? "Your browser can't read the clipboard from a button — press Ctrl+V instead."
          : "Clipboard access was blocked. Allow it in the browser prompt, or press Ctrl+V.",
      );
    }
  };

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(t);
  }, [busy]);

  const patch = (model: string, p: Partial<Run>) => setRuns((rs) => ({ ...rs, [model]: { ...rs[model], ...p } }));

  async function runOne(model: string, body: Record<string, unknown>, label: string, signal: AbortSignal, start: number) {
    let acc = "";
    const marks: SplitTimes = SPLITS.map(() => null);
    const mark = (c: string) => {
      const t = (performance.now() - start) / 1000;
      for (let i = SPLITS.length - 2; i >= 0; i--) {
        if (marks[i] == null && SPLITS[i].test(c)) {
          for (let j = 0; j <= i; j++) if (marks[j] == null) marks[j] = t;
          return true;
        }
      }
      return false;
    };
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, model }),
        signal,
      });
      if (!res.ok || !res.body) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail ?? `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        if (acc.trim()) {
          const changed = mark(acc);
          patch(model, { phase: "streaming", code: cleanCode(acc), ...(changed ? { splits: [...marks] } : {}) });
        }
      }
      const final = cleanCode(acc);
      if (final.includes("<!-- ERROR:")) throw new Error(final.split("<!-- ERROR:")[1].replace("-->", "").trim());
      const end = performance.now();
      const total = (end - start) / 1000;
      for (let i = 0; i < marks.length; i++) if (marks[i] == null) marks[i] = total;
      const pb = savePBIfBetter(marks, model);
      patch(model, { phase: "idle", code: final, splits: [...marks], end });
      setVersions((v) => [...v, { code: final, label, model }]);
      supabase
        .from("generations")
        .insert({ model, stack: String(body.stack ?? "html_tailwind"), label, code: final, duration_ms: Math.round(total * 1000) })
        .then(({ error }) => error && console.warn("save failed", error.message));
      return { model, total, pb, code: final };
    } catch (e) {
      const aborted = (e as Error).name === "AbortError";
      patch(model, { phase: "idle", end: performance.now(), error: aborted ? "Stopped" : (e as Error).message });
      return null;
    }
  }

  async function race(body: Record<string, unknown>, label: string) {
    if (!selected.length) return setError("Pick at least one model.");
    setError(null);
    setTab("preview");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const start = performance.now();
    setNow(start);
    const fresh: Record<string, Run> = {};
    for (const m of selected)
      fresh[m] = { model: m, code: "", phase: "thinking", splits: SPLITS.map(() => null), pb: loadPB(m), start, end: null, error: null };
    setRuns(fresh);
    if (!selected.includes(activeModel)) setActiveModel(selected[0]);

    let winner: string | null = null;
    const results = await Promise.all(
      selected.map((m) =>
        runOne(m, body, label, ctrl.signal, start).then((r) => {
          if (r && !winner) {
            winner = r.model;
            // Show the first finisher by default.
            setActiveModel(r.model);
            setCode(r.code);
          }
          return r;
        }),
      ),
    );
    abortRef.current = null;
    const ok = results.filter(Boolean) as NonNullable<(typeof results)[number]>[];
    setVersions((v) => {
      setActiveVersion(v.length - 1);
      return v;
    });
    if (!ok.length) {
      setRuns((rs) => {
        const msg = Object.values(rs).find((r) => r.error && r.error !== "Stopped")?.error;
        if (msg) setError(msg);
        else notify("Generation stopped");
        return rs;
      });
      return;
    }
    const best = ok.sort((a, b) => a.total - b.total)[0];
    if (selected.length > 1) notify(`🏁 ${best.model} wins in ${fmt(best.total)}s`);
    else notify(best.pb ? `🏆 New personal best · ${fmt(best.total)}s` : `✨ Finished in ${fmt(best.total)}s`);
  }

  const pickModel = (m: string) => {
    setActiveModel(m);
    const r = runs[m];
    if (r?.code && r.phase === "idle" && !r.error) setCode(r.code);
  };

  const toggleModel = (m: string) =>
    setSelected((s) => (s.includes(m) ? (s.length > 1 ? s.filter((x) => x !== m) : s) : [...s, m]));

  const generate = () => image && race({ image, stack }, "First draft");
  const update = () => {
    if (!instruction.trim() || !code) return;
    race({ stack, code, instruction }, instruction.slice(0, 40));
    setInstruction("");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    notify("📋 Copied to clipboard");
  };
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([code], { type: "text/html" }));
    a.download = `${stack}-${activeModel}.html`;
    a.click();
    notify("⬇️ Download started");
  };

  const elapsedOf = (r: Run) => Math.max(0, ((r.end ?? now) - r.start) / 1000);
  const lanes = runList.map((r) => ({
    model: r.model,
    chars: r.code.length,
    elapsed: elapsedOf(r),
    done: r.phase === "idle",
    failed: !!r.error,
    split: Math.max(0, r.splits.findIndex((t) => t == null)),
  }));
  const maxChars = Math.max(0, ...runList.map((r) => r.code.length));
  const progress = busy ? Math.min(95, Math.max(6, (maxChars / EXPECTED_CHARS) * 100)) : 0;
  const activeThinking = activeRun?.phase === "thinking";

  const hud = (compact = false) =>
    multi ? (
      <RaceHUD lanes={lanes} active={activeModel} onPick={pickModel} />
    ) : activeRun ? (
      <SpeedrunHUD
        compact={compact}
        title={activeRun.model}
        elapsed={elapsedOf(activeRun)}
        splits={activeRun.splits}
        pb={activeRun.pb}
        chars={activeRun.code.length}
      />
    ) : null;

  return (
    <main className="flex h-screen flex-col bg-paper">
      <header className="relative flex items-center justify-between border-b border-white/10 bg-paper/80 px-5 py-3 backdrop-blur">
        <Logo />
        <div className="flex items-center gap-3">
        {busy && (
          <span className="rounded-full bg-mist px-3 py-1 text-sm font-medium text-cyan">
            {multi ? `Racing ${runList.length} models` : activeThinking ? "Thinking" : `Writing · ${maxChars.toLocaleString()} chars`} ·{" "}
            {((now - (runList[0]?.start ?? now)) / 1000).toFixed(1)}s
          </span>
        )}
        {userEmail && (
          <div className="flex items-center gap-2 text-sm">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan font-bold uppercase text-ink" title={userEmail}>
              {userEmail[0]}
            </span>
            <span className="hidden text-white/55 lg:inline">{userEmail}</span>
            <button onClick={signOut} className="rounded-full border border-white/15 px-3 py-1 text-white/70 hover:border-cyan hover:text-white">
              Sign out
            </button>
          </div>
        )}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
          <div className={`h-full bg-teal transition-all duration-300 ${busy ? "opacity-100" : "opacity-0"}`} style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="flex w-full flex-col gap-5 overflow-y-auto border-white/10 bg-panel p-5 md:w-[360px] md:border-r">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              loadFile(e.dataTransfer.files[0]);
            }}
            className={`relative flex min-h-48 w-full min-w-0 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed p-3 text-center transition ${
              pasted ? "border-lime bg-lime/10" : dragging ? "scale-[1.02] border-teal bg-mist" : "border-white/15 bg-white/5 hover:border-cyan hover:bg-mist/60"
            }`}
          >
            {reading ? (
              <div className="skeleton h-40 w-full rounded-xl" />
            ) : image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Your screenshot" className="block h-auto max-h-72 w-auto max-w-full rounded-lg object-contain shadow-md animate-pop" />
                <span className="text-xs text-white/40">{pasted ? "✓ Pasted from clipboard" : "Click, drop or paste to replace"}</span>
              </>
            ) : (
              <>
                <UploadIllustration className="h-28 w-36" />
                <span className="font-display font-bold text-white/80">Drop, paste or upload</span>
                <span className="text-xs text-white/55">
                  Press <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/80">Ctrl</kbd>{" "}
                  + <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/80">V</kbd> anywhere to paste a screenshot
                </span>
              </>
            )}
            <input type="file" accept="image/*" hidden onChange={(e) => loadFile(e.target.files?.[0])} />
          </label>
          <div className="-mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={pasteFromClipboard}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-sm font-semibold text-white/80 transition hover:border-cyan hover:bg-white/5 disabled:opacity-40"
            >
              📋 Paste image
            </button>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-sm font-semibold text-white/80 transition hover:border-cyan hover:bg-white/5">
              ⬆ Upload file
              <input type="file" accept="image/*" hidden onChange={(e) => loadFile(e.target.files?.[0])} />
            </label>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">Output stack</p>
            <div className="grid grid-cols-3 gap-2">
              {STACKS.map((s) => (
                <button
                  key={s.id}
                  disabled={busy}
                  onClick={() => setFramework(s.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2 text-sm font-semibold transition ${
                    framework === s.id ? "border-teal bg-mist text-cyan shadow-sm" : "border-white/10 text-white/65 hover:border-white/25"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                  {s.label}
                </button>
              ))}
            </div>
            <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-white/40">Styling</p>
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
              {STYLINGS.map((st) => (
                <button
                  key={st.id}
                  disabled={busy}
                  onClick={() => setStyling(st.id)}
                  className={`rounded-xl px-3 py-2 text-left transition disabled:opacity-60 ${
                    styling === st.id ? "bg-white text-ink shadow" : "text-white/60 hover:text-white"
                  }`}
                >
                  <span className="block text-sm font-semibold">{st.id === "tailwind" ? "≋ " : "{ } "}{st.label}</span>
                  <span className={`block text-[11px] ${styling === st.id ? "text-ink/60" : "text-white/40"}`}>{st.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-white/40">AI models</p>
              <span className="text-xs text-white/40">{selected.length > 1 ? `${selected.length} will race` : "pick several to race"}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {models.length === 0
                ? [0, 1, 2].map((i) => <div key={i} className="skeleton h-8 w-24 rounded-full" />)
                : models.map((m) => {
                    const on = selected.includes(m);
                    return (
                      <button
                        key={m}
                        disabled={busy}
                        onClick={() => toggleModel(m)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs font-semibold transition disabled:opacity-50 ${
                          on ? "border-cyan bg-cyan/15 text-cyan" : "border-white/10 text-white/55 hover:border-white/25"
                        }`}
                      >
                        <span className={`grid h-3.5 w-3.5 place-items-center rounded-full text-[9px] ${on ? "bg-cyan text-ink" : "border border-white/30"}`}>
                          {on ? "✓" : ""}
                        </span>
                        {m}
                      </button>
                    );
                  })}
            </div>
          </div>

          {busy ? (
            <button onClick={() => abortRef.current?.abort()} className="rounded-full bg-rose-500 py-3 font-semibold text-white transition hover:bg-rose-600">
              Stop generating
            </button>
          ) : (
            <button
              onClick={generate}
              disabled={!image || reading || !selected.length}
              className="rounded-full bg-cyan py-3 font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white disabled:translate-y-0 disabled:bg-white/15 disabled:text-white/40"
            >
              {selected.length > 1 ? `Race ${selected.length} models` : "Generate code"}
            </button>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300 animate-pop">
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="font-bold" aria-label="Dismiss">
                ×
              </button>
            </div>
          )}

          {code && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-white/40">Refine</p>
              <textarea
                value={instruction}
                disabled={busy}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && update()}
                placeholder="e.g. make the header sticky and the buttons rounded"
                className="h-24 resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none focus:border-teal focus:bg-white/10 disabled:opacity-50"
              />
              <button
                onClick={update}
                disabled={busy || !instruction.trim()}
                className="rounded-xl border border-white/10 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 disabled:opacity-40"
              >
                Apply change <span className="text-white/40">· Ctrl+Enter</span>
              </button>
            </div>
          )}

          {versions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">Library · saved to your account</p>
              <ul className="flex flex-col gap-1">
                {versions.map((v, i) => (
                  <li key={i} className="animate-pop">
                    <button
                      disabled={busy}
                      onClick={() => {
                        setCode(v.code);
                        setActiveVersion(i);
                        setActiveModel(v.model);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                        activeVersion === i ? "bg-mist font-semibold text-cyan" : "text-white/65 hover:bg-white/5"
                      }`}
                    >
                      <span className="flex-1 truncate">
                        v{i + 1} · {v.label}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-white/40">{v.model}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Output */}
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-panel px-4 py-2.5 text-sm">
            <Segmented options={["preview", "code"]} value={tab} onChange={(v) => setTab(v as typeof tab)} />
            {tab === "preview" && <Segmented options={["desktop", "mobile"]} value={device} onChange={(v) => setDevice(v as typeof device)} />}
            {multi && (
              <div className="flex flex-wrap gap-1">
                {runList.map((r) => (
                  <button
                    key={r.model}
                    onClick={() => pickModel(r.model)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs transition ${
                      r.model === activeModel ? "bg-cyan text-ink" : "text-white/55 hover:bg-white/10"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        r.error ? "bg-rose-400" : r.phase === "idle" ? "bg-lime" : "animate-pulse bg-cyan"
                      }`}
                    />
                    {r.model}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center rounded-lg bg-white/5 p-0.5" aria-label="Zoom">
              <button onClick={() => zoomStep(-1)} disabled={zoom <= ZOOMS[0]} className="grid h-7 w-7 place-items-center rounded-md text-lg leading-none text-white/70 hover:bg-white/10 disabled:opacity-30" aria-label="Zoom out">
                −
              </button>
              <button onClick={() => setZoom(1)} className="w-14 rounded-md py-1 text-center font-mono text-xs tabular-nums text-white/80 hover:bg-white/10" title="Reset to 100% (Ctrl+0)">
                {Math.round(zoom * 100)}%
              </button>
              <button onClick={() => zoomStep(1)} disabled={zoom >= ZOOMS[ZOOMS.length - 1]} className="grid h-7 w-7 place-items-center rounded-md text-lg leading-none text-white/70 hover:bg-white/10 disabled:opacity-30" aria-label="Zoom in">
                +
              </button>
              <button onClick={() => setZoom(device === "desktop" ? 0.5 : 1)} className="rounded-md px-2 py-1 text-xs text-white/55 hover:bg-white/10" title="Fit overview">
                Fit
              </button>
            </div>
            <div className="ml-auto flex gap-2">
              <button disabled={!code || busy} onClick={copy} className="rounded-lg px-3 py-1.5 font-medium text-white/65 hover:bg-white/10 disabled:opacity-40">
                Copy
              </button>
              <button disabled={!code || busy} onClick={download} className="rounded-lg px-3 py-1.5 font-medium text-white/65 hover:bg-white/10 disabled:opacity-40">
                Download code
              </button>
              <button disabled={!code || busy} onClick={() => setExportOpen(true)} className="rounded-lg bg-cyan px-3 py-1.5 font-medium text-ink hover:bg-white disabled:opacity-40">
                Export image
              </button>
            </div>
          </div>

          <div
            ref={outputRef}
            className="grid-bg relative min-h-0 flex-1 overflow-auto p-5"
          >
            {activeRun?.error && activeRun.error !== "Stopped" && !busy ? (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <p className="font-display text-lg font-bold text-rose-300">{activeRun.model} didn&apos;t finish</p>
                  <p className="mt-1 max-w-md text-sm text-white/55">{activeRun.error}</p>
                </div>
              </div>
            ) : busy && !shownCode ? (
              <div className="grid h-full place-items-center">
                <div className="flex flex-col items-center gap-2">
                  <GeneratingIllustration label={multi ? "And they're off!" : "Ready, set… generate!"} />
                  {hud()}
                </div>
              </div>
            ) : !shownCode ? (
              <div className="grid h-full place-items-center">
                <EmptyCanvasIllustration />
              </div>
            ) : tab === "preview" ? (
              <div className="relative mx-auto h-full transition-[width] duration-300" style={{ width: device === "mobile" ? 390 * zoom : "100%" }}>
                <div className="h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-white shadow-xl">
                  <iframe
                    title="Preview"
                    srcDoc={withZoomBridge(shownCode)}
                    sandbox="allow-scripts"
                    className="block origin-top-left bg-white"
                    style={{ width: `${100 / zoom}%`, height: `${100 / zoom}%`, transform: `scale(${zoom})` }}
                  />
                </div>
                {activeThinking && (
                  <div className="absolute inset-0 grid place-items-center rounded-2xl bg-paper/70 backdrop-blur-sm animate-pop">{hud()}</div>
                )}
              </div>
            ) : (
              <pre style={{ fontSize: 12 * zoom }} className="whitespace-pre-wrap rounded-2xl bg-ink p-5 font-mono leading-relaxed text-white/85 shadow-xl ring-1 ring-white/10">
                {shownCode}
                {activeRun?.phase === "streaming" && <span className="animate-blink text-cyan">▌</span>}
              </pre>
            )}
          </div>
        </section>
      </div>

      {busy && shownCode && !activeThinking && <div className="fixed bottom-6 right-6 z-20 w-80 md:w-96">{hud(true)}</div>}

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} code={code} name={`${stack}-${activeModel || "page"}`} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full bg-cyan px-5 py-2.5 text-sm font-medium text-ink shadow-xl animate-pop">
          {toast}
        </div>
      )}
    </main>
  );
}

function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-lg bg-white/5 p-0.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-md px-3 py-1 capitalize transition ${value === o ? "bg-white font-semibold text-ink shadow-sm" : "text-white/55"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
