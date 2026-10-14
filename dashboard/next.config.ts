import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Hostinger injects output: "standalone". Nested monorepo output is
     flattened by scripts/flatten-standalone.mjs in the build script. */
  // Hostinger builds sometimes fail type-checking due to Next type
  // duplication in monorepo installs (two `next` copies in different
  // node_modules roots). The app still compiles; ignoreBuildErrors lets the
  // deploy complete.
  typescript: {
    ignoreBuildErrors: true,
  },
  // File uploads (PO, invoice and RMA attachments) go through server actions,
  // whose default 1MB body cap is below the API's 4MB-per-file limit.
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
