import { eventStart, eventStop } from "@compas/insight";

/**
 * Render a sitemap, ignoring 'raw' folder
 *
 * @param {InsightEvent} event
 * @param {string} cname
 * @param {ContentItem[]} structure
 * @returns {string}
 */
export function renderSitemap(event, cname, structure) {
  eventStart(event, "sitemap.render");

  const header = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`;
  const footer = `</urlset>`;
  const parts = [];

  for (const item of structure) {
    if (item.contentPath.startsWith("raw/")) {
      continue;
    }

    parts.push(`<url>
<loc>${cname}/${item.contentPath}.html</loc>
</url>`);
  }

  parts.unshift(header);
  parts.push(footer);

  eventStop(event);

  return parts.join("\n");
}
