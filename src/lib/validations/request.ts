import { z } from 'zod';

export const createRequestSchema = z.object({
  description: z
    .string()
    .min(10, 'Описанието трябва да е поне 10 символа')
    .max(1000, 'Описанието не трябва да превишава 1000 символа'),
  address: z
    .string()
    .min(5, 'Адресата трябва да е поне 5 символа')
    .max(200, 'Адресата не трябва да превишава 200 символа'),
  region_id: z
    .number()
    .int('Регионът трябва да е валиден')
    .positive('Регионът трябва да е валиден'),
  preferred_time: z
    .string()
    .optional()
    .nullable(),
  price_offer: z
    .number()
    .min(0, 'Цената трябва да е положна')
    .max(10000, 'Цената не трябва да превишава 10000 лева')
    .optional()
    .nullable(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  photos: z
    .array(z.string())
    .max(5, 'Можете да качите максимум 5 снимки')
    .optional()
    .default([]),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
