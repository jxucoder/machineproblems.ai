import { defineCollection, z } from 'astro:content';

const problems = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['protocol', 'os', 'distributed', 'security', 'networking']),
    difficulty: z.enum(['intro', 'intermediate', 'advanced']).default('intro'),
    tags: z.array(z.string()).default([]),
    actors: z.array(z.string()).optional(),
    date: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { problems };
