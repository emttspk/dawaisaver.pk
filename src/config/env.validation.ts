export interface RuntimeEnvironment {
  NODE_ENV: string;
  APP_PORT: string;
  APP_HOST: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
}

export function validateEnvironment(config: Record<string, unknown>): RuntimeEnvironment {
  const required = ["DATABASE_URL"];
  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const port = Number(config.APP_PORT || 3000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("APP_PORT must be a positive integer.");
  }

  if (config.NODE_ENV === "production") {
    const productionSecrets = ["JWT_SECRET", "JWT_REFRESH_SECRET"];
    const missingSecrets = productionSecrets.filter((key) => !config[key]);
    if (missingSecrets.length > 0) {
      throw new Error(`Missing production secrets: ${missingSecrets.join(", ")}`);
    }
  }

  return {
    NODE_ENV: String(config.NODE_ENV || "development"),
    APP_PORT: String(port),
    APP_HOST: String(config.APP_HOST || "0.0.0.0"),
    DATABASE_URL: String(config.DATABASE_URL),
    JWT_SECRET: String(config.JWT_SECRET || "development-access-secret"),
    JWT_REFRESH_SECRET: String(config.JWT_REFRESH_SECRET || "development-refresh-secret"),
  };
}
