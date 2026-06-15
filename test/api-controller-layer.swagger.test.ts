import "reflect-metadata";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../src/database/prisma.service";

describe("Swagger verification", () => {
  it("generates API documentation for the controller layer", async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://localhost:5432/dawaisaver";
    const { AppModule } = await import("../src/app.module");

    const mockPrisma = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      isHealthy: jest.fn().mockResolvedValue(true),
    } as any;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle("DawaiSaver.pk API").setVersion("1.0.0").build(),
      { deepScanRoutes: true },
    );

    const pathKeys = Object.keys(document.paths || {});
    expect(pathKeys.some((path) => path.includes("search"))).toBe(true);
    expect(pathKeys.some((path) => path.includes("prices"))).toBe(true);
    expect(pathKeys.some((path) => path.includes("drap"))).toBe(true);

    await app.close();
    process.env.DATABASE_URL = previousDatabaseUrl;
  });
});
