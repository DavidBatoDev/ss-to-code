import { GeneratingIllustration } from "@/components/illustrations";

export default function Loading() {
  return (
    <div className="grid-bg grid min-h-screen place-items-center">
      <GeneratingIllustration label="Warming up the studio…" />
    </div>
  );
}
