import { postJson } from "./api";

export interface AssistantResponse {
  success: boolean;
  answer: string;
  model?: string;
  message?: string;
}

export async function askCyberAssistant(message: string): Promise<AssistantResponse> {
  const cleanMessage = message.trim();
  if (!cleanMessage) {
    throw new Error("Please enter a question.");
  }

  const data = await postJson<AssistantResponse>("/api/assistant", { message: cleanMessage }, 120000);

  if (!data.answer) {
    throw new Error("AI Assistant returned an empty answer.");
  }
  return data;
}
