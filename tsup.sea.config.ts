import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
);

const apptrakVersion =
  process.env.APPTRAK_VERSION?.replace(/^v/, "") ?? packageJson.version;

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

  define: {
    __APPTRAK_VERSION__: JSON.stringify(apptrakVersion),
  },

  noExternal: [
    "zod",
    "commander",
    "fast-xml-parser",
    "pino",
    "pino-pretty",
    "webdriverio",
    "@appium/types",
  ],

  outDir: "dist-sea",

  outExtension() {
    return {
      js: ".cjs",
    };
  },
});
