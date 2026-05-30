import type { Response } from "express";

const clients = new Map<string, Set<Response>>();

export function addNotificationClient(userId: string, res: Response) {
  const userClients = clients.get(userId) || new Set<Response>();
  userClients.add(res);
  clients.set(userId, userClients);

  res.on("close", () => {
    userClients.delete(res);

    if (userClients.size === 0) {
      clients.delete(userId);
    }
  });
}

export function sendNotificationEvent(userId: string, data: unknown) {
  const userClients = clients.get(userId);

  if (!userClients) {
    return;
  }

  for (const client of userClients) {
    client.write("event: notification\n");
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}
