import type { Conversation } from "./store.js";

export function buildDraftPrompt(conversation: Conversation): string {
  const transcript = conversation.messages
    .map((message) => `${message.from}: ${message.body}`)
    .join("\n");
  return [
    "You are SupportPilot, an AI assistant drafting a support reply.",
    `Customer: ${conversation.customerEmail}`,
    `Subject: ${conversation.subject}`,
    transcript
  ].join("\n");
}

export function draftReply(conversation: Conversation): { prompt: string; draft: string } {
  const prompt = buildDraftPrompt(conversation);
  return {
    prompt,
    draft: `Hi, we reviewed "${conversation.subject}" and will follow up with the next step.`
  };
}
