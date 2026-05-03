import request from "supertest";
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
    expect(response.body.prompt).toContain("Account 1111222233334444");
  });

  it("accepts provider webhooks", async () => {
    const response = await request(createApp())
      .post("/api/webhooks/provider")
      .set("x-tenant-id", "org_alpha")
      .send({ id: "evt_alpha_1", organizationId: "org_alpha", type: "conversation.created" })
      .expect(202);

    expect(response.body.accepted).toBe(true);
  });
});
