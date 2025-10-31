import { FastifyInstance } from "fastify";
import { query } from "../lib/db.js";
import { redis } from "../lib/redis.js";

export async function redirectRoutes(app: FastifyInstance) {
  app.get("/:code", async (req, reply) => {
    const code = (req.params as any).code as string;

    const cacheKey = `code:${code}`;
    // 1) Cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      // non-blocking click update
      query("UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1", [code]).catch(() => {});
      return reply.status(302).redirect(cached);
    }

    // 2) DB on miss
    const res = await query("SELECT long_url FROM urls WHERE short_code = $1", [code]);
    if (res.rowCount === 0) return reply.code(404).send({ error: "Not found" });
    const url = res.rows[0].long_url as string;

    // 3) Set cache and redirect
    const ttl = Number(process.env.CACHE_TTL_SEC ?? 3600);
    await redis.setex(cacheKey, ttl, url);
    query("UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1", [code]).catch(() => {});
    return reply.status(302).redirect(url);
  });
}