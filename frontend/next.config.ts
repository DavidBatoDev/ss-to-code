import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// Production: a fully static export (out/) that Jenkins uploads to S3 and CloudFront serves.
// CloudFront routes /api/* to the FastAPI backend, so the browser stays same-origin (no CORS).
// `next dev` mirrors that routing with a rewrite to the local backend.
export default function config(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    const backend = process.env.BACKEND_URL ?? "http://localhost:8000";
    return { rewrites: async () => [{ source: "/api/:path*", destination: `${backend}/api/:path*` }] };
  }
  return { output: "export", trailingSlash: true, images: { unoptimized: true } };
}
