import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    apptrak: "src/cli/menu.ts",
  },

  format: ["cjs"],
  platform: "node",
  target: "node24",

  bundle: true,
  splitting: false,
  sourcemap: false,
  minify: true,
  clean: true,

  /*
   * Para SEA no podemos dejar dependencias npm externas.
   * Todo debe quedar dentro de apptrak.cjs.
   */
  noExternal: [
    "zod",
    "commander",
    "fast-xml-parser",
    "pino",
    "pino-pretty",
    "webdriverio",
    "@appium/types"
  ],

  outDir: "dist-sea",

  outExtension() {
    return {
      js: ".cjs",
    };
  },
});
