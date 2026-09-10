export interface AssistantResponse {

  success: boolean;

  answer: string;

  model?: string;

  message?: string;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export async function askCyberAssistant(
  message: string
): Promise<AssistantResponse> {

  const cleanMessage =
    message.trim();

  if (!cleanMessage) {
    throw new Error(
      "Please enter a question."
    );
  }

  const response =
    await fetch(
      `${API_URL}/api/assistant`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            message:
              cleanMessage,
          }),
      }
    );

  let data:
    AssistantResponse;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "Backend returned an invalid response."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        "AI Assistant request failed."
    );
  }

  if (!data.answer) {
    throw new Error(
      "AI Assistant returned an empty answer."
    );
  }

  return data;
}