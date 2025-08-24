import { FastifyInstance } from "fastify";
import { query } from "../lib/db.js";

export async function redirectRoutes(app: FastifyInstance) {
  app.get("/:code", async (req, reply) => {
    const code = (req.params as any).code as string;

    const res = await query(
      "SELECT long_url FROM urls WHERE short_code = $1",
      [code]
    );

    if (res.rowCount === 0) return reply.code(404).send({ error: "Not found" });

    // fire-and-forget click count (don’t block redirect)
    query("UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1", [code]).catch(() => {});

    return reply.status(302).redirect(res.rows[0].long_url as string);
  });
}