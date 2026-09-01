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
  // This bundle runs in a browser, inside a notebook output cell. tsup defaults
  // to platform "node", which leaves Node globals in the output: React's entry
  // selects its dev or production build with a bare `process.env.NODE_ENV`
  // comparison, and evaluating that in a browser throws ReferenceError before
  // the module finishes importing. anywidget then has nothing to render and
  // reports nothing, because the failure is an import error visible only in the
  // browser console. That is exactly how this shipped broken to Colab.
  platform: "browser",
  define: {
    // Also picks React's production build, which is the one we want shipped.
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  // Built into the Python package so the assets ship with `pip install`.
  // They previously landed in a top-level dist/, which resolves to
  // site-packages/dist after install — a directory that never exists.
  outDir: "pratyaksha/static",
  esbuildOptions(options) {
    options.alias = {
      "@": ".",
    };
    // tsconfig sets jsx: "preserve" for Next, which leaves esbuild on the
    // classic transform: it emits React.createElement and expects React to be
    // in scope. None of these components import React, because Next compiles
    // them with the automatic runtime, so every render threw
    // "ReferenceError: React is not defined" — after a successful import, which
    // made it look like a rendering problem rather than a build one.
    options.jsx = "automatic";
  },
});
