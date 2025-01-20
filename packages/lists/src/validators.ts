import z from "zod";

export const listId = z.string().uuid();

export const userId = z.string().uuid();

export const link = z.object({
  url: z.string().url(),
  localId: z.string().uuid(),
  title: z.string().min(1).max(255),
});

export const list = z.object({
  localId: listId,
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(5000),
  links: z.array(link),
  published: z.boolean().optional(),
});
