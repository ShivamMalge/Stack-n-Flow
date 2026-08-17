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
  // Built into the Python package so the assets ship with `pip install`.
  // They previously landed in a top-level dist/, which resolves to
  // site-packages/dist after install — a directory that never exists.
  outDir: "pratyaksha/static",
  esbuildOptions(options) {
    options.alias = {
      "@": ".",
    };
  },
});
