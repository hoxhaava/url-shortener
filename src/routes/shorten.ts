import { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../lib/db.js";
import { customAlphabet } from "nanoid";
import { normalizeUrl } from "../lib/url.js";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const genCode = customAlphabet(alphabet, 8);

const codeRegex = /^[0-9A-Za-z_-]{4,16}$/;
const bodySchema = z.object({
  url: z.string().min(1),
  customCode: z.string().regex(codeRegex, "code must be 4-16 chars [0-9A-Za-z_-]").optional()
});

export async function shortenRoutes(app: FastifyInstance) {
  app.post("/shorten", async (req, reply) => {
    const { url, customCode } = bodySchema.parse(req.body);
    let normalized: string;
    try {
      normalized = normalizeUrl(url);
    } catch (e: any) {
      return reply.code(400).send({ error: e.message ?? "Invalid URL" });
    }
    let code = customCode ?? genCode();

    let attempts = 0;
    while (attempts < 5) {
      const res = await query(
        `INSERT INTO urls (short_code, long_url)
         VALUES ($1, $2)
         ON CONFLICT (short_code) DO NOTHING
         RETURNING short_code`,
        [code, normalized]
      );

      if (res.rowCount === 1) {
        return reply.send({
          code,
          short: `${process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`}/${code}`
        });
      }
      if (customCode) return reply.code(409).send({ error: "Custom code already exists" });
      code = genCode();
      attempts++;
    }

    return reply.code(500).send({ error: "Could not generate unique code" });
  });
}