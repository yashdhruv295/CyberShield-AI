import {
  Bot,
  LoaderCircle,
  Send,
  Trash2,
  User,
} from "lucide-react";

import {
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  askCyberAssistant,
} from "../services/aiAssistant";

type Message = {
  role:
    | "user"
    | "assistant";

  text: string;
};

export default function CyberAssistant() {
  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [messages, setMessages] =
    useState<Message[]>([
      {
        role:
          "assistant",

        text:
          "Hello! I am CyberShield AI Assistant. Ask me a cybersecurity question.",
      },
    ]);

  const bottomRef =
    useRef<HTMLDivElement | null>(
      null
    );

  useEffect(() => {
    bottomRef.current
      ?.scrollIntoView({
        behavior:
          "smooth",
      });
  }, [
    messages,
    loading,
  ]);

  const sendMessage =
    async () => {
      const clean =
        input.trim();

      if (
        !clean ||
        loading
      ) {
        return;
      }

      setError("");

      setMessages(
        (current) => [
          ...current,
          {
            role:
              "user",
            text:
              clean,
          },
        ]
      );

      setInput("");

      try {
        setLoading(true);

        const response =
          await askCyberAssistant(
            clean
          );

        setMessages(
          (current) => [
            ...current,
            {
              role:
                "assistant",
              text:
                response.answer,
            },
          ]
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "AI Assistant failed."
        );
      } finally {
        setLoading(false);
      }
    };

  const handleKeyDown = (
    event:
      KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      void sendMessage();
    }
  };

  const quickPrompts = [
    "How can I identify a phishing email?",
    "What should I do after clicking a suspicious link?",
    "How can I create a secure password?",
  ];

  return (
    <main className="assistant-page">
      <div className="assistant-container">
        <div className="assistant-header">
          <div>
            <Bot size={34} />

            <div>
              <h1>
                Cyber AI Assistant
              </h1>

              <p>
                Ask cybersecurity
                questions powered
                by Gemini AI.
              </p>
            </div>
          </div>

          <button
            className="assistant-clear"
            onClick={() =>
              setMessages([
                {
                  role:
                    "assistant",
                  text:
                    "Chat cleared. How can I help you?",
                },
              ])
            }
          >
            <Trash2
              size={17}
            />

            Clear Chat
          </button>
        </div>

        <div className="quick-prompts">
          {quickPrompts.map(
            (prompt) => (
              <button
                key={prompt}
                onClick={() =>
                  setInput(
                    prompt
                  )
                }
              >
                {prompt}
              </button>
            )
          )}
        </div>

        <section className="assistant-chat">
          {messages.map(
            (
              message,
              index
            ) => (
              <div
                key={index}
                className={`chat-message ${message.role}`}
              >
                <div className="chat-avatar">
                  {message.role ===
                  "user" ? (
                    <User
                      size={18}
                    />
                  ) : (
                    <Bot
                      size={18}
                    />
                  )}
                </div>

                <div className="chat-bubble">
                  {
                    message.text
                  }
                </div>
              </div>
            )
          )}

          {loading && (
            <div className="chat-message assistant">
              <div className="chat-avatar">
                <Bot
                  size={18}
                />
              </div>

              <div className="chat-bubble typing-bubble">
                <LoaderCircle
                  size={18}
                  className="spin"
                />

                Thinking...
              </div>
            </div>
          )}

          <div
            ref={bottomRef}
          />
        </section>

        {error && (
          <div className="scanner-error">
            {error}
          </div>
        )}

        <div className="assistant-input-area">
          <textarea
            value={input}
            placeholder="Ask a cybersecurity question..."
            onChange={(event) =>
              setInput(
                event.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
          />

          <button
            onClick={() =>
              void sendMessage()
            }
            disabled={
              loading ||
              !input.trim()
            }
          >
            <Send size={20} />
          </button>
        </div>

        <p className="assistant-disclaimer">
          AI responses are
          educational guidance.
          For serious incidents,
          consult a qualified
          cybersecurity
          professional.
        </p>
      </div>
    </main>
  );
}