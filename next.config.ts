import type { NextConfig } from "next";
import { execSync } from "child_process";

// Short commit hash shown in the footer for deploy verification. Vercel
// provides it directly; elsewhere, ask git.
const commitHash = (() => {
  const vercelSha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (vercelSha) return vercelSha.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
})();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_COMMIT: commitHash,
  },
};

export default nextConfig;
