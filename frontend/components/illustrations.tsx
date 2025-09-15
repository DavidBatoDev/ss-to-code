// Hand-made animated SVG illustrations (no icon library).

export function HeroIllustration() {
  return (
    <div className="relative mx-auto h-[360px] w-full max-w-[520px]">
      {/* soft blobs */}
      <div className="absolute -left-6 top-10 h-48 w-48 rounded-full bg-lime/40 blur-3xl animate-float-slow" />
      <div className="absolute right-0 bottom-0 h-56 w-56 rounded-full bg-cyan/40 blur-3xl animate-float" />

      {/* screenshot card */}
      <div className="absolute left-0 top-6 w-[58%] -rotate-3 rounded-2xl border border-white/10 bg-panel p-3 shadow-xl animate-float">
        <div className="mb-2 flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-lime" />
          <span className="h-2.5 w-2.5 rounded-full bg-teal/60" />
        </div>
        <div className="relative overflow-hidden rounded-lg bg-mist p-3">
          <div className="mb-2 h-3 w-1/2 rounded bg-blue" />
          <div className="mb-1.5 h-2 w-5/6 rounded bg-white/10" />
          <div className="mb-3 h-2 w-2/3 rounded bg-white/10" />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-md bg-panel shadow-sm" />
            ))}
          </div>
          <div className="mt-3 h-6 w-20 rounded-full bg-teal" />
          {/* scanning beam */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-cyan/40 animate-scan" />
        </div>
      </div>

      {/* magic arrow */}
      <svg className="absolute left-[44%] top-[44%] h-24 w-28" viewBox="0 0 120 90" fill="none">
        <path className="dash-draw" d="M5 70 C 35 10, 80 10, 108 40" stroke="#287e87" strokeWidth="3" strokeLinecap="round" />
        <path d="M98 32 L110 42 L96 48" stroke="#287e87" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <g className="origin-center animate-spin-slow">
          <path d="M60 4 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#b6d37f" />
        </g>
      </svg>

      {/* code card */}
      <div className="absolute bottom-4 right-0 w-[58%] rotate-2 rounded-2xl bg-ink p-4 font-mono text-[11px] leading-5 shadow-2xl animate-float-slow">
        <div className="text-blue">&lt;section <span className="text-cyan">class</span>=<span className="text-lime">&quot;grid gap-4&quot;</span>&gt;</div>
        <div className="pl-3 text-blue">&lt;h1 <span className="text-cyan">class</span>=<span className="text-lime">&quot;text-3xl&quot;</span>&gt;</div>
        <div className="overflow-hidden whitespace-nowrap pl-6 text-slate-200">
          <span className="inline-block overflow-hidden align-bottom animate-type">Hello, beautiful UI</span>
          <span className="animate-blink text-cyan">▌</span>
        </div>
        <div className="pl-3 text-blue">&lt;/h1&gt;</div>
        <div className="text-blue">&lt;/section&gt;</div>
      </div>
    </div>
  );
}

export function UploadIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} fill="none">
      <ellipse cx="80" cy="108" rx="44" ry="6" fill="#0d2a30" />
      <g className="animate-float">
        <rect x="38" y="20" width="84" height="66" rx="10" fill="#0f2f35" stroke="#8bd2e7" strokeWidth="2.5" />
        <circle cx="60" cy="42" r="8" fill="#b6d37f" />
        <path d="M44 78 L68 54 L84 68 L96 58 L116 78Z" fill="#75d8ee" />
        <path d="M44 78 L68 54 L84 68" stroke="#287e87" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <g className="animate-bounce" style={{ transformOrigin: "128px 22px" }}>
        <circle cx="128" cy="22" r="13" fill="#287e87" />
        <path d="M128 28 V16 M122 21 L128 15 L134 21" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M22 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#b6d37f" className="animate-pulse" />
    </svg>
  );
}

export function RobotIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 140" className={className} fill="none">
      <ellipse cx="80" cy="128" rx="40" ry="6" fill="#0d2a30" />
      <g className="animate-float">
        <line x1="80" y1="18" x2="80" y2="32" stroke="#287e87" strokeWidth="3" />
        <circle cx="80" cy="14" r="6" fill="#b6d37f" className="animate-pulse" />
        <rect x="44" y="32" width="72" height="56" rx="18" fill="#0f2f35" stroke="#287e87" strokeWidth="3" />
        <rect x="54" y="44" width="52" height="28" rx="10" fill="#071b1f" />
        <circle cx="68" cy="58" r="5" fill="#75d8ee" className="animate-blink" />
        <circle cx="92" cy="58" r="5" fill="#75d8ee" className="animate-blink" />
        <rect x="56" y="92" width="48" height="26" rx="10" fill="#8bd2e7" />
        <g className="animate-wiggle" style={{ transformOrigin: "44px 96px" }}>
          <rect x="24" y="92" width="22" height="9" rx="4.5" fill="#75d8ee" />
        </g>
        <g className="animate-wiggle" style={{ transformOrigin: "116px 96px", animationDelay: ".6s" }}>
          <rect x="114" y="92" width="22" height="9" rx="4.5" fill="#75d8ee" />
        </g>
      </g>
      <text x="16" y="40" fill="#78a9e8" fontSize="16" fontFamily="monospace" className="animate-pulse">&lt;/&gt;</text>
      <text x="124" y="28" fill="#42b9bb" fontSize="14" fontFamily="monospace" className="animate-bounce">{"{ }"}</text>
    </svg>
  );
}

export function CodeIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} fill="none">
      <ellipse cx="80" cy="110" rx="46" ry="6" fill="#0d2a30" />
      <g className="animate-float-slow">
        <rect x="26" y="16" width="108" height="80" rx="12" fill="#071b1f" />
        <circle cx="40" cy="28" r="3" fill="#78a9e8" />
        <circle cx="50" cy="28" r="3" fill="#b6d37f" />
        <circle cx="60" cy="28" r="3" fill="#42b9bb" />
        <rect x="38" y="42" width="40" height="5" rx="2.5" fill="#78a9e8" className="skeleton-bar" />
        <rect x="46" y="54" width="60" height="5" rx="2.5" fill="#75d8ee" />
        <rect x="46" y="66" width="44" height="5" rx="2.5" fill="#b6d37f" />
        <rect x="38" y="78" width="30" height="5" rx="2.5" fill="#78a9e8" />
        <rect x="94" y="66" width="3" height="8" fill="#8bd2e7" className="animate-blink" />
      </g>
      <g className="animate-spin-slow" style={{ transformOrigin: "136px 18px" }}>
        <path d="M136 6 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3z" fill="#b6d37f" />
      </g>
    </svg>
  );
}

export function EmptyCanvasIllustration() {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="w-72 rounded-2xl border border-white/10 bg-panel p-4 shadow-lg animate-float">
        <div className="mb-3 flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-lime" />
          <span className="h-2.5 w-2.5 rounded-full bg-teal/60" />
        </div>
        <div className="skeleton mb-2 h-4 w-1/2 rounded" />
        <div className="skeleton mb-2 h-3 w-5/6 rounded" />
        <div className="skeleton mb-4 h-3 w-2/3 rounded" />
        <div className="grid grid-cols-3 gap-2">
          <div className="skeleton h-14 rounded-lg" />
          <div className="skeleton h-14 rounded-lg" />
          <div className="skeleton h-14 rounded-lg" />
        </div>
      </div>
      <div>
        <p className="font-display text-lg font-bold text-white/80">Your canvas is waiting</p>
        <p className="text-sm text-white/55">Drop a screenshot on the left and watch it come alive.</p>
      </div>
    </div>
  );
}

export function GeneratingIllustration({ label = "Reading pixels, writing code…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <RobotIllustration className="h-36 w-40" />
      <p className="font-display font-bold text-cyan">{label}</p>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-mist0" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}
