import { HeroIllustration } from "@/components/illustrations";
import { Logo } from "@/components/logo";

// Split-screen layout shared by login / sign-up / reset pages.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden border-r border-white/10 bg-ink lg:flex lg:flex-col">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan/15 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-lime/10 blur-3xl animate-float" />

        <div className="relative flex flex-1 flex-col p-10">
          <Logo />
          <div className="mt-14 max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-cyan" />
              5 OpenAI models · one race
            </span>
            <h2 className="font-display mt-5 text-4xl font-extrabold leading-tight text-white">
              Turn any screenshot into <span className="text-cyan">production code.</span>
            </h2>
            <p className="mt-3 text-white/55">HTML, React or Vue with Tailwind — streamed live, refined by chat, saved to your library.</p>
          </div>

          <div className="relative mt-6 flex-1 scale-90">
            <HeroIllustration />
          </div>

          <figure className="relative rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
            <div className="text-sm text-lime">★★★★★</div>
            <blockquote className="mt-2 text-sm text-white/80">
              “We prototype client pitches in an afternoon now. The first draft is usually 90% there.”
            </blockquote>
            <figcaption className="mt-3 flex items-center gap-3 text-xs">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan font-bold text-ink">M</span>
              <span>
                <span className="block font-semibold text-white">Maya R.</span>
                <span className="text-white/50">Frontend lead, fintech startup</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </aside>

      {/* Form panel */}
      <section className="relative flex flex-col">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px] animate-pop">{children}</div>
        </div>
        <p className="pb-6 text-center text-xs text-white/35">© {new Date().getFullYear()} Pixel2Code · Secured by Supabase Auth</p>
      </section>
    </main>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-white/80">
        {label}
        {hint}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-cyan focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan/15";

export function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />;
}
