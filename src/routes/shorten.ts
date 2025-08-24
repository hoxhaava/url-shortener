import { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../lib/db.js";
import { customAlphabet } from "nanoid";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const genCode = customAlphabet(alphabet, 8);

const bodySchema = z.object({
  url: z.string().url(),
  customCode: z.string().min(4).max(16).optional()
});

export async function shortenRoutes(app: FastifyInstance) {
  app.post("/shorten", async (req, reply) => {
    const { url, customCode } = bodySchema.parse(req.body);
    let code = customCode ?? genCode();

    let attempts = 0;
    while (attempts < 5) {
      const res = await query(
        `INSERT INTO urls (short_code, long_url)
         VALUES ($1, $2)
         ON CONFLICT (short_code) DO NOTHING
         RETURNING short_code`,
        [code, url]
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