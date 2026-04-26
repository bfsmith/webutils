// Runs a simple static server for the built client app through bun

declare const Bun: {
  env: Record<string, string | undefined>;
  file(path: string): Blob & { exists(): Promise<boolean> };
  serve(options: {
    port: number;
    fetch(request: Request): Response | Promise<Response>;
  }): { stop(closeActiveConnections?: boolean): void | Promise<void> };
};

declare const process: {
  once(signal: "SIGINT" | "SIGTERM", listener: () => void): void;
  exit(code?: number): never;
};

const port = Number(Bun.env.PORT ?? 3000);
const dist = "/app/dist";

const server = Bun.serve({
  port,
  async fetch(request: Request) {
    const url = new URL(request.url);
    const requestedPath = decodeURIComponent(url.pathname);
    const safePath = requestedPath
      .split("/")
      .filter((part) => part && part !== "." && part !== "..")
      .join("/");
    const filePath = safePath ? `${dist}/${safePath}` : `${dist}/index.html`;
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    return new Response(Bun.file(`${dist}/index.html`));
  },
});

let isShuttingDown = false;

const shutdown = async () => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  await server.stop(true);
  process.exit(0);
};

process.once("SIGINT", () => {
  void shutdown();
});
process.once("SIGTERM", () => {
  void shutdown();
});
