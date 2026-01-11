import { z } from "zod";

const dateField = z
  .union([z.string(), z.number()])
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    if (typeof val === "number") {
      return new Date(val).toISOString();
    }
    return val;
  });

export const echotabTagSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  favorite: z.boolean().default(false),
  isQuick: z.boolean().default(false),
  isAI: z.boolean().default(false),
});

export const echotabTabSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  url: z.string(),
  tagIds: z.array(z.number()),
  faviconUrl: z.string().optional(),
  pinned: z.boolean().optional(),
  savedAt: dateField,
  visitedAt: dateField,
  lastCuratedAt: dateField,
  note: z.string().optional(),
});

export const echotabListSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  content: z.string().optional(),
  tabIds: z.array(z.string().uuid()),
  savedAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const echotabCurationSchema = z.object({
  date: z.string(),
  kept: z.number(),
  deleted: z.number(),
});

export const echotabDataSchema = z.object({
  tags: z.array(echotabTagSchema),
  tabs: z.array(echotabTabSchema),
  lists: z.array(echotabListSchema).optional(),
  curations: z.array(echotabCurationSchema).optional(),
});

export type EchotabTag = z.infer<typeof echotabTagSchema>;
export type EchotabTab = z.infer<typeof echotabTabSchema>;
export type EchotabList = z.infer<typeof echotabListSchema>;
export type EchotabCuration = z.infer<typeof echotabCurationSchema>;
export type EchotabData = z.infer<typeof echotabDataSchema>;
