import { readFile } from "fs/promises";
import * as path from "path";
import { eventStart, eventStop } from "@compas/insight";
import { pathJoin, processDirectoryRecursive } from "@compas/stdlib";
import frontMatter from "front-matter";
import hljs from "highlight.js";
import marked from "marked";
import { validateContentItem } from "./generated/validators.js";

const contentDirectory = pathJoin(process.cwd(), "content");

/**
 * Create a list of markdown files with their content paths
 *
 * @param {Event} event
 * @returns {Promise<ContentItem[]>}
 */
export async function getContentStructure(event) {
  eventStart(event, "content.getContentStructure");

  /** @type {ContentItem[]} */
  const files = [];

  await processDirectoryRecursive(contentDirectory, (file) => {
    if (!file.endsWith(".md")) {
      return;
    }

    const resourcePath = path.relative(contentDirectory, file);
    const contentPath = resourcePath.substring(0, resourcePath.length - 3);

    files.push({
      filePath: file,
      contentPath,
    });
  });

  eventStop(event);

  return files;
}

/**
 * Set metadata and htmlContent for a ContentItem
 *
 * @param {Event} event
 * @param {ContentItem} item
 * @returns {Promise<void>}
 */
export async function annotateItemWithContents(event, item) {
  if (item.metadata) {
    return;
  }

  eventStart(event, "content.annotateItemWithContents");

  const source = await readFile(item.filePath, "utf-8");
  const parsedFrontMatter = frontMatter(source);
  const htmlContent = marked(parsedFrontMatter.body);

  item.metadata = parsedFrontMatter.attributes;
  item.htmlContent = htmlContent;

  const { errors } = validateContentItem(item);
  if ((errors?.length ?? 0) > 0) {
    event.log.error({
      contentPath: item.contentPath,
      errors,
    });
  }
}

export function setMarkedOptions() {
  marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: function (code, language) {
      const validLanguage = hljs.getLanguage(language) ? language : "plaintext";
      return hljs.highlight(validLanguage, code).value;
    },
  });
}
