import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { writeFileSync } from "fs";
import { resolve } from "path";

/**
 * Vite plugin that generates a version.json manifest in the build output.
 * Used by useVersionCheck hook to detect new deployments and auto-reload.
 * Only fires during `vite build` (closeBundle), never during `vite dev`.
 */
function versionStampPlugin() {
  let outDir = "dist";
  return {
    name: "version-stamp",
    configResolved(config: { build: { outDir: string } }) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const manifest = {
        buildId: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      writeFileSync(resolve(outDir, "version.json"), JSON.stringify(manifest));
      console.log(`[version-stamp] Generated version.json: ${manifest.buildId}`);
    },
  };
}

export default defineConfig({
  plugins: [react(), versionStampPlugin()],
});

