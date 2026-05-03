const { z } = require("zod");

const localeCodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(16)
  .regex(/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i, "Locale code format is invalid")
  .transform((value) => value.toLowerCase());

const loginBodySchema = z.object({
  username: z.string().trim().min(1).max(100).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200)
});

const createLocaleBodySchema = z.object({
  code: localeCodeSchema
});

const localeParamsSchema = z.object({
  code: localeCodeSchema
});

const translationParamsSchema = z.object({
  locale: localeCodeSchema
});

const translationsQuerySchema = z.object({
  locale: localeCodeSchema
});

const translationsBodySchema = z
  .record(z.string().trim().min(1).max(255), z.string().max(10000))
  .superRefine((value, ctx) => {
    for (const key of Object.keys(value)) {
      if (!key.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Translation keys cannot be empty",
          path: [key]
        });
      }
    }
  });

module.exports = {
  loginBodySchema,
  createLocaleBodySchema,
  localeParamsSchema,
  translationParamsSchema,
  translationsQuerySchema,
  translationsBodySchema
};
