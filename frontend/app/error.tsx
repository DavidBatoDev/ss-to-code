"use client";

import { RobotIllustration } from "@/components/illustrations";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid-bg grid min-h-screen place-items-center px-5 text-center">
      <div>
        <RobotIllustration className="mx-auto h-40 w-44" />
        <h1 className="font-display mt-4 text-2xl font-extrabold text-white">Our robot tripped over a wire</h1>
        <p className="mt-2 text-white/55">Something went wrong. Give it another go.</p>
        <button onClick={reset} className="mt-6 rounded-full bg-cyan px-6 py-2.5 font-semibold text-ink hover:bg-white">
          Try again
        </button>
      </div>
    </div>
  );
}
