import { FastifyInstance } from "fastify";
import { query } from "../lib/db.js";

export async function statsRoutes(app: FastifyInstance) {
  app.get("/stats/:code", async (req, reply) => {
    const code = (req.params as any).code as string;

    const res = await query(
      `SELECT short_code, long_url, clicks, created_at
       FROM urls
       WHERE short_code = $1`,
      [code]
    );

    if (res.rowCount === 0) return reply.code(404).send({ error: "Not found" });
    return reply.send(res.rows[0]);
  });
}