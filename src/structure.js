/**
 * Find breadcrumb items for the specified contentPath
 *
 * @param {ContentItem[]} structure
 * @param {string} contentPath
 * @returns {ContentItem[]}
 */
import { AppError } from "@compas/stdlib";

export function getBreadcrumbsForContentPath(structure, contentPath) {
  const breadCrumbs = [];
  const contentPathMap = {};

  // Make items mappable by contentPath
  for (const item of structure) {
    contentPathMap[item.contentPath] = item;
  }

  if (contentPathMap["index"] && contentPath !== "index") {
    // Always add the root index path
    breadCrumbs.push(contentPathMap["index"]);
  }

  // For every combination check if an index page exist. With input ["foo", "bar",
  // "baz"] the following pages will be checked in order:
  // "foo/index", "foo/bar/index"
  const contentPathParts = contentPath.split("/");
  for (let i = 0; i < contentPathParts.length - 1; ++i) {
    const partialContentPath = `${contentPathParts
      .slice(0, i + 1)
      .join("/")}/index`;

    // if index page exists and is not current page add as breadcrumb
    if (
      contentPathMap[partialContentPath] &&
      partialContentPath !== contentPath
    ) {
      breadCrumbs.push(contentPathMap[partialContentPath]);
    }
  }

  return breadCrumbs;
}

/**
 * Find navigatable pages for this index page
 *
 * @param {ContentItem[]} structure
 * @param {string} contentPath
 * @returns {ContentItem[]}
 */
export function getIndexNavigationListForContentPath(structure, contentPath) {
  const navigationPages = [];
  const contentPathMap = {};

  // Make items mappable by contentPath
  for (const item of structure) {
    contentPathMap[item.contentPath] = item;
  }

  const contentPathWithoutIndex = contentPath.substring(
    0,
    contentPath.length - "/index".length,
  );

  for (const item of structure) {
    if (item.contentPath === contentPath) {
      continue;
    }

    if (!item.contentPath.startsWith(contentPathWithoutIndex)) {
      continue;
    }

    // Relative path after contentPathWithoutIndex does not include leading slash
    const relativePath = item.contentPath.substring(
      contentPathWithoutIndex.length + 1,
    );

    if (relativePath.indexOf("/") === -1) {
      // No extra nesting, should be on this level
      navigationPages.push(item);
      continue;
    }

    if (relativePath.endsWith("/index")) {
      const strippedRelativePath = relativePath.substring(
        0,
        relativePath.length - "/index".length,
      );

      // Index page of a child directory
      if (strippedRelativePath.indexOf("/") === -1) {
        navigationPages.push(item);
      }
    }
  }

  return navigationPages;
}

/**
 * Sorts a content item array following the specified order
 *
 * @param {ContentItem[]} array
 */
export function sortContentItemArray(array) {
  const orderSet = new Set();

  for (const item of array) {
    orderSet.add(item.metadata.order);
  }

  if (orderSet.size !== array.length) {
    throw AppError.validationError("structure.sortContentItemArray.notUnique", {
      orderSet: [...orderSet],
    });
  }

  array.sort((a, b) => {
    return a.metadata.order - b.metadata.order;
  });
}
