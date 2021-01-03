import { TypeCreator } from "@compas/code-gen";

export function extendWithContent(app) {
  const T = new TypeCreator("content");

  app.add(
    T.object("item").keys({
      filePath: T.string(),
      contentPath: T.string(),
      metadata: T.optional().value({
        type: T.string().oneOf("blog", "page"),
        title: T.string(),
        date: T.date().optional(),
        description: T.string(),
        order: T.number().convert(),
        tags: [T.string()],
      }),
      htmlContent: T.string().optional(),
    }),
  );
}
