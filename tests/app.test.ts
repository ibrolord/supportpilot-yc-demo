import request from "supertest";
import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("SupportPilot launch PR", () => {
  it("lists only conversations for the active tenant", async () => {
    const response = await request(createApp())
      .get("/api/conversations")
      .set("x-tenant-id", "org_alpha")
      .expect(200);

    expect(response.body.conversations).toHaveLength(1);
    expect(response.body.conversations[0].id).toBe("conv_alpha_1");
  });

  it("generates an AI support draft", async () => {
    const response = await request(createApp())
      .post("/api/conversations/conv_alpha_1/ai-draft")
      .set("x-tenant-id", "org_alpha")
      .expect(200);

    expect(response.body.draft).toContain("Wire transfer stuck");
    expect(response.body.prompt).not.toContain("pat@alpha.example");
    expect(response.body.prompt).not.toContain("1111222233334444");
    expect(response.body.prompt).toContain("[redacted-number]");
  });

  it("denies cross-tenant conversation reads and exports", async () => {
    await request(createApp())
      .get("/api/conversations/conv_beta_1")
      .set("x-tenant-id", "org_alpha")
      .expect(404);

    await request(createApp())
      .get("/api/conversations/conv_beta_1/export")
      .set("x-tenant-id", "org_alpha")
      .expect(404);
  });

  it("rejects unsigned provider webhooks", async () => {
    await request(createApp())
      .post("/api/webhooks/provider")
      .set("x-tenant-id", "org_alpha")
      .send({ id: "evt_unsigned", organizationId: "org_alpha", type: "conversation.created" })
      .expect(401);
  });

  it("accepts valid signed provider webhooks", async () => {
    const body = { id: "evt_alpha_1", organizationId: "org_alpha", type: "conversation.created" };
    const response = await request(createApp())
      .post("/api/webhooks/provider")
      .set("x-tenant-id", "org_alpha")
      .set("x-supportpilot-signature", signWebhook(body))
      .send(body)
      .expect(202);

    expect(response.body.accepted).toBe(true);
  });
});

function signWebhook(body: object): string {
  return `sha256=${crypto
    .createHmac("sha256", "demo_webhook_secret")
    .update(JSON.stringify(body))
    .digest("hex")}`;
}
