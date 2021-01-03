import { App } from "@compas/code-gen";
import { mainFn } from "@compas/stdlib";
import { extendWithContent } from "../gen/content.js";

mainFn(import.meta, main);

/**
 * @type {CliWatchOptions}
 */
export const cliWatchOptions = {
  ignoredPatterns: ["src", "out", "content"],
};

async function main() {
  const app = new App({ verbose: true });

  extendWithContent(app);
  await app.generate({
    enabledGenerators: ["type", "validator"],
    isNode: true,
    throwingValidators: false,
    outputDirectory: "./src/generated",
  });
}
