export interface ApplicationConfig {
  name: string;
  nodeEnv: string;
  port: number;
  host: string;
  globalPrefix: string;
  corsOrigins: string[];
}

