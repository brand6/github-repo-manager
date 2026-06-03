import { startHttpServer, type RunningHttpServer } from "./runtime.js";

interface CliArgs {
  port: number;
  dev: boolean;
  dataDir: string | null;
}

const args = parseArgs(process.argv.slice(2));
let runtime: RunningHttpServer | null = null;
let shuttingDown = false;

try {
  runtime = await startHttpServer({ port: args.port, dev: args.dev, dataDir: args.dataDir });
  console.log(`Local AI project manager listening on ${runtime.url}`);
} catch (error) {
  const nodeError = error as NodeJS.ErrnoException;
  if (nodeError.code === "EADDRINUSE") {
    console.error(`Port ${args.port} is already in use. Restart with --port <port>.`);
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
}

process.once("SIGINT", () => shutdown());
process.once("SIGTERM", () => shutdown());

function shutdown(): void {
  if (shuttingDown) return;
  shuttingDown = true;
  if (!runtime) {
    process.exit(0);
    return;
  }
  runtime
    .close()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

function parseArgs(argv: string[]): CliArgs {
  let port = 3987;
  let dev = false;
  let dataDir: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dev") {
      dev = true;
    } else if (arg === "--port") {
      const value = argv[index + 1];
      if (!value) throw new Error("--port requires a value");
      port = Number(value);
      index += 1;
    } else if (arg === "--data-dir") {
      const value = argv[index + 1];
      if (!value) throw new Error("--data-dir requires a value");
      dataDir = value;
      index += 1;
    }
  }

  return { port, dev, dataDir };
}
