import { newEvent, newEventFromEvent } from "@compas/insight";
import { mainFn } from "@compas/stdlib";
import {
  annotateItemWithContents,
  getContentStructure,
} from "../src/content.js";

mainFn(import.meta, main);

/**
 * Load all content files and check if the metadata is correct
 *
 * @param {Logger} logger
 * @returns {Promise<void>}
 */
async function main(logger) {
  const event = newEvent(logger);
  const content = await getContentStructure(newEventFromEvent(event));

  await Promise.all(
    content.map((it) => annotateItemWithContents(newEventFromEvent(event), it)),
  );
}
