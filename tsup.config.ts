import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bridge/pratyaksha-bridge.tsx"],
  format: ["esm"],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  external: ["react", "react-dom"], // anywidget usually provides these or we bundle them
  noExternal: [/(.*)/], // Bundle everything else
  outDir: "dist",
  esbuildOptions(options) {
    options.alias = {
      "@": ".",
    };
  },
});
