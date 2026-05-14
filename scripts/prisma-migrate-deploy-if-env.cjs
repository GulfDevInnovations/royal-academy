const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

function hasMigrations() {
  try {
    const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
    const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
    return entries.some((e) => e.isDirectory());
  } catch {
    return false;
  }
}

function isBuildLifecycle() {
  const lifecycleEvent = process.env.npm_lifecycle_event;
  if (typeof lifecycleEvent === "string") {
    if (
      lifecycleEvent === "prebuild" ||
      lifecycleEvent === "build" ||
      lifecycleEvent === "postbuild"
    ) {
      return true;
    }
  }

  const nextPhase = process.env.NEXT_PHASE;
  return typeof nextPhase === "string" && nextPhase.toLowerCase().includes("build");
}

function shouldRunMigrateDeploy() {
  const forced = process.env.PRISMA_MIGRATE_DEPLOY;
  if (forced === "1" || forced === "true") return true;

  return !isBuildLifecycle();
}

function hasDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  return typeof url === "string" && url.trim().length > 0;
}

if (!hasDatabaseUrl()) {
  console.log(
    "[prisma] DATABASE_URL is not set; skipping `prisma migrate deploy`."
  );
  process.exit(0);
}

if (!shouldRunMigrateDeploy()) {
  console.log(
    "[prisma] Skipping `prisma migrate deploy` during build. Set PRISMA_MIGRATE_DEPLOY=1 to force it."
  );
  process.exit(0);
}

console.log("[prisma] Running `prisma migrate deploy`...");
try {
  if (hasMigrations()) {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
  } else {
    console.warn(
      "[prisma] No migration folders found in prisma/migrations. Falling back to `prisma db push` to sync schema."
    );
    execSync("npx prisma db push", { stdio: "inherit" });
  }
} catch (error) {
  if (isBuildLifecycle()) {
    console.warn(
      "[prisma] `prisma migrate deploy` failed during build; continuing without failing the build."
    );
    process.exit(0);
  }

  throw error;
}
