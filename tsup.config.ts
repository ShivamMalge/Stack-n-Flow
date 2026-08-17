import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bridge/pratyaksha-bridge.tsx"],
  format: ["esm"],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: true,
  noExternal: [/(.*)/], // Bundle everything, including React — the widget loads standalone
  outDir: "dist",
  esbuildOptions(options) {
    options.alias = {
      "@": ".",
    };
  },
});
