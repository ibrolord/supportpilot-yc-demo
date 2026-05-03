import express from "express";
import crypto from "node:crypto";
import { draftReply } from "./ai.js";
import { conversations, organizations, webhookEvents } from "./store.js";

const webhookSecret = process.env.WEBHOOK_SECRET || "demo_webhook_secret";

export function createApp() {
  const app = express();
  app.use(
    express.json({
      verify: (request, _response, buffer) => {
        (request as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
      }
    })
  );

  app.get("/", (_request, response) => {
    response.type("html").send(`
      <main>
        <h1>SupportPilot</h1>
        <p>AI support inbox API for multi-tenant teams.</p>
        <ul>
          <li>GET /api/conversations</li>
          <li>GET /api/conversations/:conversationId</li>
          <li>POST /api/conversations/:conversationId/ai-draft</li>
          <li>GET /api/conversations/:conversationId/export</li>
          <li>POST /api/webhooks/provider</li>
        </ul>
      </main>
    `);
  });

  app.get("/api/organizations", (_request, response) => {
    response.json({ organizations });
  });

  app.get("/api/conversations", (request, response) => {
    const organizationId = requireTenant(request);
    response.json({
      conversations: conversations.filter((conversation) => conversation.organizationId === organizationId)
    });
  });

  app.get("/api/conversations/:conversationId", (request, response) => {
    const organizationId = requireTenant(request);
    const conversation = findTenantConversation(request.params.conversationId, organizationId);
    if (!conversation) {
      response.status(404).json({ error: "conversation_not_found" });
      return;
    }
    response.json({ conversation });
  });

  app.post("/api/conversations/:conversationId/ai-draft", (request, response) => {
    const organizationId = requireTenant(request);
    const conversation = findTenantConversation(request.params.conversationId, organizationId);
    if (!conversation) {
      response.status(404).json({ error: "conversation_not_found" });
      return;
    }
    response.json(draftReply(conversation));
  });

  app.get("/api/conversations/:conversationId/export", (request, response) => {
    const organizationId = requireTenant(request);
    const conversation = findTenantConversation(request.params.conversationId, organizationId);
    if (!conversation) {
      response.status(404).json({ error: "conversation_not_found" });
      return;
    }
    response.json({
      exportedAt: new Date("2026-05-03T12:00:00Z").toISOString(),
      conversation
    });
  });

  app.post("/api/webhooks/provider", (request, response) => {
    if (!hasValidWebhookSignature(request)) {
      response.status(401).json({ error: "invalid_signature" });
      return;
    }
    const event = {
      id: String(request.body.id || `evt_${webhookEvents.length + 1}`),
      organizationId: String(request.body.organizationId || requireTenant(request)),
      type: String(request.body.type || "conversation.updated"),
      payload: request.body
    };
    webhookEvents.push(event);
    response.status(202).json({ accepted: true, eventId: event.id });
  });

  app.use(
    (
      error: Error & { statusCode?: number },
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction
    ) => {
      response.status(error.statusCode || 500).json({ error: error.message || "server_error" });
    }
  );

  return app;
}

function requireTenant(request: express.Request): string {
  const organizationId = request.header("x-tenant-id");
  if (!organizationId) {
    throw Object.assign(new Error("missing tenant"), { statusCode: 401 });
  }
  return organizationId;
}

function findTenantConversation(conversationId: string, organizationId: string) {
  return conversations.find(
    (item) => item.id === conversationId && item.organizationId === organizationId
  );
}

function hasValidWebhookSignature(request: express.Request): boolean {
  const signature = request.header("x-supportpilot-signature") || "";
  const rawBody = (request as express.Request & { rawBody?: Buffer }).rawBody || Buffer.from("{}");
  const expected = `sha256=${crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex")}`;
  if (signature.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
