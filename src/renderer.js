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
 * @param {Event} event
 * @param {string} cname
 * @param {ContentItem[]} structure
 * @param {ContentItem} page
 * @return {Promise<string>}
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
            code {background: white;}
            a {border-bottom: 1px solid #444444; color: #444444; text-decoration: none;}
            a:hover {border-bottom: 0;}
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
 * @param {Event} event
 * @param {string} cname
 * @param {ContentItem[]} structure
 * @param {ContentItem} page
 * @return Promise<string>
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
  sortContentItemArray(navigationList);

  if (navigationList.length === 0) {
    return "";
  }

  let contents = "<article><ul>";
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
 * @param {Event} event
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
