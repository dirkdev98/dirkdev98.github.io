---
title: First post description: First post on my personal blog date: 2020-12-31 tags: []
type: blog order: 2
---

# First post

Hello! Time to get a personal blog going. Build a quick setup to statically
convert Markdown pages to HTML including a dev server for previews.

## The stack

Using [front-matter](https://www.npmjs.com/package/front-matter) to extract page
titles, descriptions and the actual markdown from files. Then it is passed
through [marked](https://marked.js.org/) to convert Markdown to HTML. The dev
server uses a [Compas](https://compasjs.com) provide Koa instance and renders
the pages on the fly.

### Extra's

On top of converting the pages to HTML it also adds some breadcrumbs and
'index'-navigation pages, to make it easier to navigate through the site when
landing on an article.
