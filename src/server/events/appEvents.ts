import type { Response } from "express";

export interface AppEvent {
  type: string;
  at: string;
  [key: string]: unknown;
}

export class AppEventHub {
  private readonly clients = new Set<Response>();

  addClient(response: Response): () => void {
    response.status(200);
    response.set({
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no"
    });
    if (typeof response.flushHeaders === "function") {
      response.flushHeaders();
    }

    this.clients.add(response);
    response.write(": connected\n\n");

    const heartbeat = setInterval(() => {
      if (!response.destroyed) response.write(": heartbeat\n\n");
    }, 30_000);
    heartbeat.unref?.();

    const cleanup = () => {
      clearInterval(heartbeat);
      this.clients.delete(response);
    };

    response.on("close", cleanup);
    response.on("error", cleanup);
    return cleanup;
  }

  emit(event: AppEvent): void {
    const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
    for (const client of [...this.clients]) {
      if (client.destroyed) {
        this.clients.delete(client);
        continue;
      }
      client.write(payload);
    }
  }
}
