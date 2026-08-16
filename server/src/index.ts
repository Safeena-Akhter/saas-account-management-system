// Single entrypoint for the API server.
// `npm run dev` and `npm run start` both point here (see package.json).

import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";
import { verifyMailerConnection } from "./config/mailer";
import { runExpiryCheck } from "./services/subscription.service";

// Subscription expiry automation ("Expiry Date" / "Expiry Warning" per the
// Subscription Management module spec). No job runner (e.g. node-cron)
// exists elsewhere in this codebase, so a plain setInterval is the
// consistent choice here - runs once on boot (so a subscription that
// expired while the server was down is caught immediately) and then every
// hour. Failures are caught and logged, not thrown, so a bad run can never
// crash the process the way an unhandled interval-callback rejection
// would.
const EXPIRY_CHECK_INTERVAL_MS = 60 * 60 * 1000;

async function runExpiryCheckSafely() {
  try {
    const result = await runExpiryCheck();

    if (result.expired > 0 || result.warned > 0) {
      console.log(`🔔 Subscription expiry check: ${result.expired} expired, ${result.warned} expiring-soon warnings sent`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Subscription expiry check failed:", err);
  }
}

const server = app.listen(env.PORT, async () => {
  console.log(`🚀 AMS Server running on port ${env.PORT} [${env.NODE_ENV}]`);

  await verifyMailerConnection();
  void runExpiryCheckSafely();
});

const expiryCheckInterval = setInterval(runExpiryCheckSafely, EXPIRY_CHECK_INTERVAL_MS);
async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received, shutting down gracefully...`);

  clearInterval(expiryCheckInterval);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
