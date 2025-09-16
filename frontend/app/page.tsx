import Link from "next/link";
import { LiveDemo } from "@/components/demo";
import { AppIcon, Logo } from "@/components/logo";
import { CodeIllustration, HeroIllustration, RobotIllustration, UploadIllustration } from "@/components/illustrations";

const steps = [
  { Art: UploadIllustration, title: "Drop a screenshot", text: "Paste, drag or upload any UI — a website, a Dribbble shot, a napkin sketch." },
  { Art: RobotIllustration, title: "AI reads every pixel", text: "gpt-5.5 studies layout, spacing, colors and type, then writes the markup." },
  { Art: CodeIllustration, title: "Ship real code", text: "Get clean HTML, React or Vue with Tailwind. Tweak it by chatting, then download." },
];

const stacks = ["HTML", "React", "Vue", "Tailwind CSS", "Responsive", "Accessible markup", "Font Awesome", "Mobile preview"];

const stats = [
  { value: "~10s", label: "average time to first draft" },
  { value: "3", label: "frameworks out of the box" },
  { value: "∞", label: "chat-based refinements" },
  { value: "0", label: "lines you write by hand" },
];

const features = [
  { title: "Live streaming", text: "Watch code appear token by token and the preview build itself in real time.", art: "stream" },
  { title: "Speedrun timer", text: "Splits, chars/sec and your personal best — generation is oddly satisfying.", art: "timer" },
  { title: "Chat to refine", text: "“Make the header sticky.” Describe a change, get a full updated version.", art: "chat" },
  { title: "Version history", text: "Every draft is saved. Jump back to any version with one click.", art: "history" },
  { title: "Desktop & mobile", text: "Flip between viewports to check responsiveness before you ship.", art: "device" },
  { title: "Copy or download", text: "One click to clipboard or a ready-to-open HTML file.", art: "download" },
] as const;

// Sample quotes for the demo landing page — replace with real customer feedback before launch.
const testimonials = [
  { name: "Maya R.", role: "Frontend lead, fintech startup", quote: "We prototype client pitches in an afternoon now. The first draft is usually 90% there.", color: "bg-cyan" },
  { name: "Jonas K.", role: "Indie hacker", quote: "I screenshot landing pages I love and get a Tailwind starting point in seconds. Wild.", color: "bg-lime" },
  { name: "Priya S.", role: "Product designer", quote: "Finally a handoff where the developer and I are looking at the same thing on day one.", color: "bg-blue" },
  { name: "Leo M.", role: "Agency founder", quote: "The chat refinements are the killer feature. ‘Make it darker, tighten spacing’ — done.", color: "bg-teal" },
  { name: "Ana T.", role: "Bootcamp instructor", quote: "Students compare their hand-written CSS with the AI version. Great learning tool.", color: "bg-cyan" },
  { name: "Sam O.", role: "Full-stack engineer", quote: "Watching the speedrun splits go green when it beats my PB is way too fun.", color: "bg-lime" },
];

const faqs = [
  { q: "What can I upload?", a: "Any PNG, JPG or WebP up to 8 MB — website screenshots, app mockups, design files, even hand-drawn wireframes." },
  { q: "Which AI model powers it?", a: "OpenAI's gpt-5.5 with vision. Your image is sent to OpenAI only to generate code and is not stored by us." },
  { q: "Is the code production-ready?", a: "It's clean, semantic and responsive Tailwind. Treat it as a strong first draft — wire up your data and logic, and ship." },
  { q: "Can I edit the result?", a: "Yes. Describe changes in plain English and get a full updated version, or copy the code into your editor." },
  { q: "Which frameworks are supported?", a: "HTML + Tailwind, React + Tailwind and Vue + Tailwind today, with more on the way." },
];

function FeatureArt({ kind }: { kind: (typeof features)[number]["art"] }) {
  switch (kind) {
    case "stream":
      return (
        <div className="w-full space-y-1.5 rounded-xl bg-ink p-3 font-mono text-[10px] text-cyan">
          <div className="h-2 w-3/4 rounded bg-cyan/70" />
          <div className="h-2 w-1/2 rounded bg-lime/70" />
          <div className="flex items-center gap-1">
            <div className="h-2 w-1/3 animate-pulse rounded bg-blue/70" />
            <span className="animate-blink text-lime">▌</span>
          </div>
        </div>
      );
    case "timer":
      return (
        <div className="rounded-xl bg-ink px-4 py-2 text-center">
          <div className="font-mono text-2xl font-bold text-lime">09.84</div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-cyan">new PB −1.2</div>
        </div>
      );
    case "chat":
      return (
        <div className="w-full space-y-2 text-[11px]">
          <div className="ml-auto w-3/4 rounded-2xl rounded-br-sm bg-cyan px-3 py-1.5 text-ink animate-pop">Make the header sticky</div>
          <div className="w-2/3 rounded-2xl rounded-bl-sm bg-panel px-3 py-1.5 text-white shadow animate-pop" style={{ animationDelay: ".4s" }}>
            Done ✓ v2 ready
          </div>
        </div>
      );
    case "history":
      return (
        <div className="w-full space-y-1.5">
          {["v3 · darker theme", "v2 · sticky header", "v1 · first draft"].map((v, i) => (
            <div key={v} className={`rounded-lg px-3 py-1 text-[11px] ${i === 0 ? "bg-ink text-white" : "bg-panel text-white/55 shadow-sm"}`}>
              {v}
            </div>
          ))}
        </div>
      );
    case "device":
      return (
        <div className="flex items-end gap-3">
          <div className="h-16 w-24 rounded-lg border-2 border-ink bg-panel p-1.5 animate-float">
            <div className="skeleton h-2 w-2/3 rounded" />
          </div>
          <div className="h-20 w-10 rounded-lg border-2 border-teal bg-panel p-1 animate-float-slow">
            <div className="skeleton h-2 rounded" />
          </div>
        </div>
      );
    case "download":
      return (
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-panel px-3 py-2 text-[11px] font-semibold text-white shadow">index.html</div>
          <div className="grid h-9 w-9 animate-bounce place-items-center rounded-full bg-lime font-bold text-ink">↓</div>
        </div>
      );
  }
}

export default function Landing() {
  return (
    <main className="grid-bg min-h-screen overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-transparent bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <div className="hidden items-center gap-7 text-sm font-medium text-white/65 md:flex">
            <a href="#demo" className="hover:text-white">Demo</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#reviews" className="hover:text-white">Reviews</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-white/75 hover:text-white sm:block">
            Sign in
          </Link>
          <Link href="/studio" className="rounded-full bg-cyan px-5 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white">
            Open studio
          </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-2 md:pt-16">
        <div className="animate-pop">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/50 bg-mist px-3 py-1 text-xs font-semibold text-cyan">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-teal" />
            Powered by gpt-5.5
          </span>
          <h1 className="font-display mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl">
            Screenshots in.
            <br />
            <span className="text-teal">Real code</span> out.
          </h1>
          <p className="mt-5 max-w-md text-lg text-white/65">
            Pixel2Code turns any interface into production-ready HTML, React or Vue with Tailwind — streamed live, editable by conversation.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/studio" className="rounded-full bg-cyan px-7 py-3 font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white">
              Try it free →
            </Link>
            <a href="#demo" className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition hover:border-cyan">
              ▶ Watch the demo
            </a>
          </div>
          <div className="mt-8 flex items-center gap-3 text-sm text-white/55">
            <div className="flex -space-x-2">
              {["bg-cyan", "bg-lime", "bg-blue", "bg-teal"].map((c, i) => (
                <span key={c} className={`grid h-8 w-8 place-items-center rounded-full border-2 border-paper text-xs font-bold text-ink ${c}`}>
                  {"MJPL"[i]}
                </span>
              ))}
            </div>
            Loved by designers & developers
          </div>
        </div>
        <HeroIllustration />
      </section>

      {/* Marquee */}
      <section className="border-y border-white/10 bg-panel py-4">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
          {[...stacks, ...stacks, ...stacks].map((s, i) => (
            <span key={i} className="flex items-center gap-10 text-sm font-semibold text-white/40">
              {s} <span className="text-teal">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <div className="mb-10 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Live demo</span>
          <h2 className="font-display mt-2 text-4xl font-extrabold text-white">From pixels to page in seconds</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/65">Click the steps to explore, or sit back and watch it loop.</p>
        </div>
        <LiveDemo />
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className="rounded-3xl border border-white/10 bg-panel p-6 text-center animate-pop" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="font-display text-4xl font-extrabold text-white">{s.value}</div>
              <div className="mt-1 text-sm text-white/55">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal">How it works</span>
          <h2 className="font-display mt-2 text-4xl font-extrabold text-white">Three steps. Zero hand-coding.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map(({ Art, title, text }, i) => (
            <div key={title} className="group rounded-3xl border border-white/10 bg-panel p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex h-40 items-center justify-center rounded-2xl bg-mist">
                <Art className="h-36 w-44 transition group-hover:scale-105" />
              </div>
              <div className="mt-5 text-xs font-bold text-teal">STEP {i + 1}</div>
              <h3 className="font-display mt-1 text-xl font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm text-white/65">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 bg-ink py-20 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan">Features</span>
            <h2 className="font-display mt-2 text-4xl font-extrabold">Everything you need to go from idea to UI</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/10">
                <div className="flex h-32 items-center justify-center rounded-2xl bg-mist p-4 transition group-hover:scale-[1.02]">
                  <FeatureArt kind={f.art} />
                </div>
                <h3 className="font-display mt-5 text-lg font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-white/60">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal">What users say</span>
          <h2 className="font-display mt-2 text-4xl font-extrabold text-white">Builders are shipping faster</h2>
        </div>
        <div className="relative mt-12 overflow-hidden">
          <div className="flex w-max animate-marquee-slow gap-5 px-5 hover:[animation-play-state:paused]">
            {[...testimonials, ...testimonials].map((t, i) => (
              <figure key={i} className="w-80 shrink-0 rounded-3xl border border-white/10 bg-panel p-6 shadow-sm">
                <div className="text-lime">★★★★★</div>
                <blockquote className="mt-3 text-white/80">“{t.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-full font-bold text-ink ${t.color}`}>{t.name[0]}</span>
                  <span>
                    <span className="block font-semibold text-white">{t.name}</span>
                    <span className="block text-xs text-white/55">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 pb-20">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal">FAQ</span>
          <h2 className="font-display mt-2 text-4xl font-extrabold text-white">Questions, answered</h2>
        </div>
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-white/10 bg-panel p-5 open:shadow-md">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-white">
                {f.q}
                <span className="grid h-7 w-7 place-items-center rounded-full bg-mist text-cyan transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-white/65">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-cyan px-8 py-16 text-center text-ink">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cyan/20 blur-2xl animate-float" />
          <div className="absolute -bottom-10 right-10 h-48 w-48 rounded-full bg-lime/25 blur-2xl animate-float-slow" />
          <AppIcon className="relative mx-auto h-16 w-16 animate-float" />
          <h2 className="font-display relative mt-6 text-4xl font-extrabold">Your next UI is one screenshot away.</h2>
          <p className="relative mx-auto mt-3 max-w-md text-white/60">No sign-up. Drop an image and watch the speedrun.</p>
          <Link href="/studio" className="relative mt-8 inline-block rounded-full bg-lime px-8 py-3 font-semibold text-ink transition hover:-translate-y-0.5">
            Open the studio →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-panel">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-white/55 md:flex-row">
          <Logo />
          <span>Built with Next.js, FastAPI & OpenAI · deployed with Jenkins, k3s & Terraform</span>
          <span>© {new Date().getFullYear()} Pixel2Code</span>
        </div>
      </footer>
    </main>
  );
}
