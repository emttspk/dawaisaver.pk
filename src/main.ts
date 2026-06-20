import "reflect-metadata";
import helmet from "helmet";
import { Logger, RequestMethod, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { RequestLoggerInterceptor } from "./common/interceptors/request-logger.interceptor";
import { ResponseEnvelopeInterceptor } from "./common/interceptors/response-envelope.interceptor";
import { StartupDiagnosticsService } from "./common/observability/startup-diagnostics.service";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const logger = new Logger("Bootstrap");
  const config = app.get(ConfigService);
  const port = config.get<number>("app.port", 3000);
  const host = config.get<string>("app.host", "0.0.0.0");
  const globalPrefix = config.get<string>("app.globalPrefix", "api/v1");
  const corsOrigins = config.get<string[]>("app.corsOrigins", []);

  app.use(helmet());
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });
  app.setGlobalPrefix(globalPrefix, {
    exclude: [
      { path: "health", method: RequestMethod.GET },
      { path: "health/database", method: RequestMethod.GET },
      { path: "health/application", method: RequestMethod.GET },
      { path: "health/deployment", method: RequestMethod.GET },
      { path: "deploy-fingerprint", method: RequestMethod.GET },
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor(), new RequestLoggerInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("DawaiSaver.pk API")
    .setDescription("Backend APIs for search, discovery, price intelligence, matching, DRAP, and source sync.")
    .setVersion("1.0.0")
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    deepScanRoutes: true,
  });
  SwaggerModule.setup("docs", app, swaggerDocument, {
    useGlobalPrefix: true,
  });

  app.get(StartupDiagnosticsService).log();

  await app.listen(port, host);
  logger.log(`DawaiSaver.pk API listening on http://${host}:${port}`);

}

void bootstrap();
