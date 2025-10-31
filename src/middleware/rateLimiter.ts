import fp from "fastify-plugin";
import { redis } from "../lib/redis.js";

type Opts = { windowSec: number; tokens: number };

export default fp<Opts>(async (app, { windowSec, tokens }) => {
  app.addHook("onRequest", async (req, reply) => {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      "unknown";

    const hitsKey = `rl:hits:${ip}`;
    const ttlKey = `rl:ttl:${ip}`;

    // increment and fetch TTL in one round-trip
    const pipeline = redis.multi();
    pipeline.incr(hitsKey);
    pipeline.ttl(ttlKey);
    const [hits, ttl] = (await pipeline.exec())!.map((x) => x[1]) as [number, number];

    if (ttl < 0) {
      // first hit in window: start window TTL on both keys
      await redis.multi()
        .expire(hitsKey, windowSec)
        .setex(ttlKey, windowSec, "1")
        .exec();
    }

    if (hits > tokens) {
      return reply.code(429).send({ error: "Too Many Requests" });
    }
  });
});