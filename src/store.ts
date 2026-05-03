export type Organization = {
  id: string;
  name: string;
};

export type Conversation = {
  id: string;
  organizationId: string;
  customerEmail: string;
  subject: string;
  messages: Array<{
    from: "customer" | "agent";
    body: string;
  }>;
};

export type WebhookEvent = {
  id: string;
  organizationId: string;
  type: string;
  payload: unknown;
};

export const organizations: Organization[] = [
  { id: "org_alpha", name: "Alpha Bank" },
  { id: "org_beta", name: "Beta Health" }
];

export const conversations: Conversation[] = [
  {
    id: "conv_alpha_1",
    organizationId: "org_alpha",
    customerEmail: "pat@alpha.example",
    subject: "Wire transfer stuck",
    messages: [
      { from: "customer", body: "My transfer to Acme is stuck. Account 1111222233334444." },
      { from: "agent", body: "We are checking the payment rail status." }
    ]
  },
  {
    id: "conv_beta_1",
    organizationId: "org_beta",
    customerEmail: "lee@beta.example",
    subject: "Reset SSO",
    messages: [
      { from: "customer", body: "Please reset my SSO for patient portal user lee@beta.example." }
    ]
  }
];

export const webhookEvents: WebhookEvent[] = [];
