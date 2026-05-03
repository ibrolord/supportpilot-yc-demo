import express from "express";
import { draftReply } from "./ai.js";
import { conversations, organizations, webhookEvents } from "./store.js";

export function createApp() {
  const app = express();
  app.use(express.json());

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
    requireTenant(request);
    const conversation = conversations.find((item) => item.id === request.params.conversationId);
    if (!conversation) {
      response.status(404).json({ error: "conversation_not_found" });
      return;
    }
    response.json({ conversation });
  });

  app.post("/api/conversations/:conversationId/ai-draft", (request, response) => {
    requireTenant(request);
    const conversation = conversations.find((item) => item.id === request.params.conversationId);
    if (!conversation) {
      response.status(404).json({ error: "conversation_not_found" });
      return;
    }
    response.json(draftReply(conversation));
  });

  app.get("/api/conversations/:conversationId/export", (request, response) => {
    requireTenant(request);
    const conversation = conversations.find((item) => item.id === request.params.conversationId);
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
    const event = {
      id: String(request.body.id || `evt_${webhookEvents.length + 1}`),
      organizationId: String(request.body.organizationId || requireTenant(request)),
      type: String(request.body.type || "conversation.updated"),
      payload: request.body
    };
    webhookEvents.push(event);
    response.status(202).json({ accepted: true, eventId: event.id });
  });

  return app;
}

function requireTenant(request: express.Request): string {
  const organizationId = request.header("x-tenant-id");
  if (!organizationId) {
    throw Object.assign(new Error("missing tenant"), { statusCode: 401 });
  }
  return organizationId;
}
