import Link from "next/link";

export function AppIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#071b1f" />
      <path
        d="M14 22v-6a2 2 0 0 1 2-2h6M42 14h6a2 2 0 0 1 2 2v6M50 42v6a2 2 0 0 1-2 2h-6M22 50h-6a2 2 0 0 1-2-2v-6"
        stroke="#42b9bb" strokeWidth="3.5" strokeLinecap="round" fill="none"
      />
      <path d="M27 25l-7 7 7 7M37 25l7 7-7 7" stroke="#75d8ee" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M33.5 22l-3 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="49" cy="15" r="4" fill="#b6d37f" className="animate-pulse" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="font-display flex items-center gap-2.5 text-xl font-extrabold text-white">
      <AppIcon />
      Pixel2Code
    </Link>
  );
}
