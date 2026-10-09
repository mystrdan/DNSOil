import Fastify from "fastify";

const app = Fastify({
  logger: true,
  requestIdHeader: "x-request-id",
  disableRequestLogging: false,
});

app.get("/health", async () => ({
  status: "ok",
  service: "dnsoil-api",
  timestamp: new Date().toISOString(),
}));

app.get("/ready", async (_request, reply) => {
  // Database connectivity will be checked here when persistence is wired in.
  return reply.code(200).send({ status: "ready", checks: { database: "not-configured" } });
});

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
