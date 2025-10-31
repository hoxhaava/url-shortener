import Fastify from "fastify";
import "dotenv/config";
import { query } from "./lib/db.js";
import { redis } from "./lib/redis.js";
import { shortenRoutes } from "./routes/shorten.js";
import { redirectRoutes } from "./routes/redirect.js";
import rateLimiter from "./middleware/rateLimiter.js";
import { statsRoutes } from "./routes/stats.js";

const app = Fastify({ logger: true });
const PORT = Number(process.env.PORT ?? 3000);

app.get("/health", async () => ({ status: "ok" }));

app.get("/db-health", async (req, reply) => {
    try {
      const r = await query("SELECT 1 as ok");
      return { ok: r.rows[0].ok === 1 };
    } catch (e) {
      reply.code(500);
      return { ok: false, error: "db unreachable" };
    }
  });
  
app.get("/redis-health", async (req, reply) => {
    try {
      const pong = await redis.ping();
      return { ok: pong === "PONG" };
    } catch (e) {
      reply.code(500);
      return { ok: false, error: "redis unreachable" };
    }
});

app.register(shortenRoutes);
app.register(redirectRoutes);
app.register(statsRoutes);
app.register(rateLimiter, {
  windowSec: Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60),
  tokens: Number(process.env.RATE_LIMIT_TOKENS ?? 100),
})

app.listen({ port: PORT }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});