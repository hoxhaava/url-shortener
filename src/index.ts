import Fastify from "fastify";
import "dotenv/config";
import { query } from "./lib/db.js";
import { redis } from "./lib/redis.js";

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

app.listen({ port: PORT }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});