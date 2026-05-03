import type { Conversation } from "./store.js";

export function buildDraftPrompt(conversation: Conversation): string {
  const transcript = conversation.messages
    .map((message) => `${message.from}: ${redactSensitiveText(message.body)}`)
    .join("\n");
  return [
    "You are SupportPilot, an AI assistant drafting a support reply.",
    `Customer: ${redactSensitiveText(conversation.customerEmail)}`,
    `Subject: ${redactSensitiveText(conversation.subject)}`,
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

export function redactSensitiveText(value: string): string {
  return value
    .replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[redacted-email]")
    .replace(/\b(?:\d[ -]?){12,19}\b/g, "[redacted-number]");
}
