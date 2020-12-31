import { existsSync } from "fs";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import {
  isNil,
  mainFn,
  pathJoin,
  processDirectoryRecursive,
} from "@compas/stdlib";
import frontMatter from "front-matter";
import marked from "marked";

mainFn(import.meta, main);

const outputDirectory = pathJoin(process.cwd(), "/out");
const contentDirectory = pathJoin(process.cwd(), "/content");

/**
 * @typedef MarkdownFile
 * @property {PageMetadata} metadata
 * @property {string} file
 * @property {number} blogIndex
 * @property {string} htmlContent
 */

/**
 * @typedef PageMetadata
 * @property {string} title
 * @property {string} [description]
 * @property {Date} [date]
 * @property {string[]} [tags]
 */

/**
 */
async function main() {
  const cname = await readCnameFile();
  setMarkedOptions(cname);
  await prepareOutputDirectory();

  const { home, pages } = await readContentFiles();
  home.file = "/index.html";
  home.htmlContent += `<ul>${pages
    .map((it) => `<li><a href="/${it.file}">${it.metadata.title}</a></li>`)
    .join("\n")}</ul>`;

  pages.push(home);

  for (const page of pages) {
    await writeFile(
      pathJoin(outputDirectory, page.file),
      pageRenderer(cname, page),
    );
  }
}

/**
 * Read the CNAME file
 *
 * @returns {Promise<string>}
 */
async function readCnameFile() {
  const contents = await readFile(pathJoin(process.cwd(), "/CNAME"), "utf-8");
  return `https://${contents.trim()}`;
}

/**
 * Read content directory
 *
 * @returns {Promise<{pages: MarkdownFile[], home: MarkdownFile}>}
 */
async function readContentFiles() {
  const pages = [];
  let home = undefined;

  await processDirectoryRecursive(contentDirectory, async (file) => {
    if (!file.endsWith(".md")) {
      return;
    }
    const contents = await readFile(file, "utf-8");
    const parsedContents = parseMarkdown(file, contents);

    if (file.indexOf("_home.md") !== -1) {
      home = parsedContents;
    } else {
      pages.push(parsedContents);
    }
  });

  return { pages, home };
}

/**
 * Clear old files, create CNAME and .nojekyll files
 * @returns {Promise<void>}
 */
async function prepareOutputDirectory() {
  if (existsSync(outputDirectory)) {
    await rm(outputDirectory, { recursive: true });
  }
  await mkdir(outputDirectory, { recursive: true });

  await writeFile(pathJoin(outputDirectory, "/.nojekyll"), "", "utf-8");
  await writeFile(
    pathJoin(outputDirectory, "/CNAME"),
    await readFile(pathJoin(process.cwd(), "/CNAME")),
    "utf-8",
  );
}

/**
 * Normalize front-matter, render markdown to HTML
 *
 * @param {string} file
 * @param {string} contents
 * @returns {MarkdownFile}
 */
function parseMarkdown(file, contents) {
  const parsedFrontMatter = frontMatter(contents);
  const htmlContent = marked(parsedFrontMatter.body);

  const fileName = file.split("/").pop();
  const [rawBlogIndex, ...name] = fileName.split("-");
  const blogIndex = Number(rawBlogIndex);
  const htmlFileName = name.join("-").replace(".md", ".html");

  return {
    file: fileName.startsWith("_") ? "" : htmlFileName,
    blogIndex: fileName.startsWith("_") ? -1 : blogIndex,
    htmlContent,
    metadata: parsedFrontMatter.attributes,
  };
}

/**
 * Set marked option
 * // TODO:
 * @param {string} cname
 */
function setMarkedOptions(cname) {
  marked.setOptions({
    cname,
  });
}

/**
 * Render a page to Markdown
 *
 * @param {string} cname
 * @param {MarkdownFile} file
 */
function pageRenderer(cname, file) {
  return `
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0"/>
        <title>${file.metadata.title}</title>
        <meta name="description" content="${file.metadata.description}"/>
        <link rel="canonical" href="${cname}/${file.file}"/>
        <style>
            body {margin: 5% auto; background: #f2f2f2; color: #444444; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.8; text-shadow: 0 1px 0 #ffffff; max-width: 73%;}
            code {background: white;}
            a {border-bottom: 1px solid #444444; color: #444444; text-decoration: none;}
            a:hover {border-bottom: 0;}
        </style>
    </head>
    <body>
    <header>
    <a href="${cname}/index.html">Back to home</a> - ${formatDate(
    file.metadata.date,
  )}
</header>
      ${file.htmlContent}
      <footer>
    <a href="${cname}/index.html">Back to home</a> - ${formatDate(
    file.metadata.date,
  )}
</footer>
    </body>
</html>
  `;
}

/**
 *
 * @param {Date} date
 */
function formatDate(date) {
  if (isNil(date)) {
    return "";
  }
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
