import { runDrapMirrorJob } from "../jobs/drap-mirror.job";
import { Logger } from "@nestjs/common";

async function main() {
  const logger = new Logger("DrapMirrorCLI");
  logger.log("Starting DRAP mirror job...");
  try {
    await runDrapMirrorJob(logger, { bypass: true });
    logger.log("DRAP mirror job completed.");
    process.exit(0);
  } catch (error) {
    logger.error("DRAP mirror job failed.", error);
    process.exit(1);
  }
}

void main();