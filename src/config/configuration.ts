export const configuration = () => ({
  app: {
    name: process.env.APP_NAME || "DawaiSaver.pk API",
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.APP_PORT || 3000),
    host: process.env.APP_HOST || "0.0.0.0",
    globalPrefix: process.env.APP_GLOBAL_PREFIX || "api",
    corsOrigins: parseList(process.env.CORS_ORIGINS),
  },
  database: {
    url: process.env.DATABASE_URL,
    runMigrationsOnBoot: process.env.RUN_MIGRATIONS_ON_BOOT === "true",
  },
  storage: {
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2BucketName: process.env.R2_BUCKET_NAME,
  },
  crawler: {
    userAgent: process.env.CRAWLER_USER_AGENT || "DawaiSaverBot/0.1",
    concurrency: Number(process.env.CRAWLER_CONCURRENCY || 2),
  },
  rateLimit: {
    ttlSeconds: Number(process.env.RATE_LIMIT_TTL_SECONDS || 60),
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 120),
  },
});

function parseList(value?: string): string[] {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
