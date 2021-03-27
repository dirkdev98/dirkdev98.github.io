import { readFile } from "fs/promises";
import * as path from "path";
import { eventStart, eventStop } from "@compas/insight";
import { pathJoin, processDirectoryRecursive } from "@compas/stdlib";
import frontMatter from "front-matter";
import hljs from "highlight.js";
import marked from "marked";
import { validateContentItem } from "./generated/content/validators.js";

const contentDirectory = pathJoin(process.cwd(), "content");

/**
 * Create a list of markdown files with their content paths
 *
 * @param {InsightEvent} event
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
 * @param {InsightEvent} event
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
      return hljs.highlight(code, { language: validLanguage }).value;
    },
  });

  marked.use({
    renderer: {
      // Add anchor (#) links to headings.
      // This makes it easier to point someone to a specific thing in the
      // docs. We skip h1, since we should only use that for page titles.
      heading(text, level, raw, slugger) {
        const escapedId = slugger.slug(raw);
        const anchor =
          level === 1
            ? ""
            : `<a name="${escapedId}" class="anchor" href="#${escapedId}">#</a>`;

        return `<h${level} id="${escapedId}">
  ${text}
  ${anchor}
</h${level}>\n`;
      },

      // Conditionally wrap things in paragraphs, not sure if it is the
      // best idea, but may work okay for now.
      paragraph(text) {
        const tags = [["<em", "em>"], ["<img"]];

        if (!text) {
          return "";
        }

        for (const [start, end] of tags) {
          if (start && text.startsWith(start) && (!end || text.endsWith(end))) {
            return `${text}<br>`;
          }
        }

        return `<p>${text}</p>\n`;
      },
    },
  });
}
