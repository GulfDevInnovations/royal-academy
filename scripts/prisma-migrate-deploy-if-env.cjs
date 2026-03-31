const { execSync } = require("node:child_process");
require("dotenv").config();

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

console.log("[prisma] Running `prisma migrate deploy`...");
execSync("npx prisma migrate deploy", { stdio: "inherit" });
