import { eventStart, eventStop, newEventFromEvent } from "@compas/insight";
import { isNil } from "@compas/stdlib";
import { annotateItemWithContents } from "./content.js";
import {
  getBreadcrumbsForContentPath,
  getIndexNavigationListForContentPath,
  sortContentItemArray,
} from "./structure.js";

/**
 * Render a page
 *
 * @param {InsightEvent} event
 * @param {string} cname
 * @param {ContentItem[]} structure
 * @param {ContentItem} page
 * @returns {Promise<string>}
 */
export async function renderPage(event, cname, structure, page) {
  eventStart(event, "renderer.renderPage");

  const breadcrumbPages = getBreadcrumbsForContentPath(
    structure,
    page.contentPath,
  );
  await Promise.all(
    breadcrumbPages.map((it) =>
      annotateItemWithContents(newEventFromEvent(event), it),
    ),
  );

  const headerAndFooter = collectPageHeaderAndFooter(
    newEventFromEvent(event),
    page,
    cname,
    breadcrumbPages,
  );

  const result = `
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0"/>
        <title>${page.metadata.title}</title>
        <meta name="description" content="${page.metadata.description}"/>
        <link rel="canonical" href="${formatUrl(cname, page.contentPath)}"/>
        <style>
            body {margin: 5% auto; background: #f2f2f2; color: #444444; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.8; text-shadow: 0 1px 0 #ffffff; max-width: 73%;}
            pre, code {background: white;}
            pre {padding-left: 2px; line-height: 1.2; }
            code {margin-left: 2px; margin-right: 2px; }
            a {border-bottom: 1px solid #444444; color: #444444; text-decoration: none;}
            a:hover {border-bottom: 0;}
            a.anchor { float: right; text-decoration: none; padding: 1px 3px; border-bottom: none; }
            .hljs{display:block;overflow-x:auto;padding:.5em;background:#f0f0f0}.hljs,.hljs-subst{color:#444}.hljs-comment{color:#888}.hljs-attribute,.hljs-doctag,.hljs-keyword,.hljs-meta-keyword,.hljs-name,.hljs-selector-tag{font-weight:700}.hljs-deletion,.hljs-number,.hljs-quote,.hljs-selector-class,.hljs-selector-id,.hljs-string,.hljs-template-tag,.hljs-type{color:#800}.hljs-section,.hljs-title{color:#800;font-weight:700}.hljs-link,.hljs-regexp,.hljs-selector-attr,.hljs-selector-pseudo,.hljs-symbol,.hljs-template-variable,.hljs-variable{color:#bc6060}.hljs-literal{color:#78a960}.hljs-addition,.hljs-built_in,.hljs-bullet,.hljs-code{color:#397300}.hljs-meta{color:#1f7199}.hljs-meta-string{color:#4d99bf}.hljs-emphasis{font-style:italic}.hljs-strong{font-weight:700}
        </style>
    </head>
    <body>
    <header>
        ${headerAndFooter}
    </header>
    <main>
    <article>
        ${page.htmlContent}
    </article>
    ${await renderIndexNavigation(
      newEventFromEvent(event),
      cname,
      structure,
      page,
    )}
    </main>
    <footer>
        ${headerAndFooter}
    </footer>
    </body>
</html>
  `;

  eventStop(event);

  return result;
}

/**
 * Render all pages of a directory if this page is an 'index' page
 *
 * @param {InsightEvent} event
 * @param {string} cname
 * @param {ContentItem[]} structure
 * @param {ContentItem} page
 * @returns Promise<string>
 */
async function renderIndexNavigation(event, cname, structure, page) {
  if (!page.contentPath.endsWith("index")) {
    return "";
  }

  eventStart(event, "renderer.indexNavigation");

  const navigationList = getIndexNavigationListForContentPath(
    structure,
    page.contentPath,
  );
  await Promise.all(
    navigationList.map((it) =>
      annotateItemWithContents(newEventFromEvent(event), it),
    ),
  );

  try {
    sortContentItemArray(navigationList);
  } catch (e) {
    e.info.page = page.metadata;
    throw e;
  }

  if (navigationList.length === 0) {
    return "";
  }

  let contents = "<hr><article><ul>";
  for (const item of navigationList) {
    contents += `<li><a href="${formatUrl(cname, item.contentPath)}">${
      item.metadata.title
    }</a></li>`;
  }
  contents += "</ul></article>";

  eventStop(event);
  return contents;
}

/**
 * Format header and footer with breadcrumbs and post date
 *
 * @param {InsightEvent} event
 * @param {ContentItem} page
 * @param {string} cname
 * @param {ContentItem[]} breadcrumbPages
 * @returns {string}
 */
function collectPageHeaderAndFooter(event, page, cname, breadcrumbPages) {
  eventStart(event, "renderer.collectPageHeaderAndFooter");

  let contents = "";

  const formatDate = (date) => {
    const year = String(date.getUTCFullYear()).padStart(4, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  contents += "<nav>";

  for (let i = 0; i < breadcrumbPages.length; i++) {
    const breadcrumb = breadcrumbPages[i];
    contents += `<a href="${formatUrl(cname, breadcrumb.contentPath)}">${
      breadcrumb.metadata.title
    }</a>`;

    if (i !== breadcrumbPages.length - 1) {
      contents += " > ";
    }
  }

  if (page.metadata?.type === "blog" && !isNil(page.metadata?.date)) {
    contents += ` - ${formatDate(page.metadata.date)}`;
  }
  contents += "</nav>";

  eventStop(event);

  return contents;
}

/**
 * Format a full url
 *
 * @param {string} cname
 * @param {string} contentPath
 * @returns {string}
 */
function formatUrl(cname, contentPath) {
  if (contentPath.length > 0) {
    return `${cname}/${contentPath}.html`;
  }

  return `${cname}/index.html`;
}
