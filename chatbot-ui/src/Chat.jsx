import React, { useEffect, useRef, useState } from "react";

const suggestedPrompts = [
  "What courses are offered at SECE?",
  "How can I contact the admissions office?",
  "Tell me about placements and campus facilities.",
];

function formatInline(text) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function renderMessage(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) return;

    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc space-y-2 pl-5 marker:text-slate-400">
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`} className="pl-1 text-[15px] leading-7 text-slate-700">
            {formatInline(item)}
          </li>
        ))}
      </ul>,
    );

    listItems = [];
  };

  lines.forEach((line) => {
    const listMatch = line.match(/^(?:\*|-)\s+(.*)$/);

    if (listMatch) {
      listItems.push(listMatch[1]);
      return;
    }

    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="text-[15px] leading-7 text-slate-700">
        {formatInline(line)}
      </p>,
    );
  });

  flushList();

  return blocks;
}

function MessageBody({ text, sender }) {
  if (sender === "user") {
    return <p className="whitespace-pre-wrap text-[15px] leading-7 text-white">{text}</p>;
  }

  return <div className="space-y-4">{renderMessage(text)}</div>;
}

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (messageText = input) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isLoading) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: trimmedMessage,
        time: timestamp,
      },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const API_URL = "https://ai-chatbot-for-college.onrender.com";
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `question=${encodeURIComponent(trimmedMessage)}`,
      });

      const data = await res.text();

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      
      // Scroll to bottom after bot response
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I couldn't reach the assistant right now. Please make sure the Flask server is running and try again.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.20),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.16),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#eef4f8_100%)] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <aside className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/75 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur xl:p-8">
          <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-teal-100 blur-3xl" />
          <div className="absolute right-10 top-10 h-28 w-28 rounded-full bg-sky-100/70 blur-2xl" />

          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-5">
              <span className="inline-flex rounded-full bg-teal-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
                SECE virtual assistant
              </span>
              <div className="space-y-4">
                <h1 className="max-w-[12ch] text-4xl font-semibold leading-none tracking-[-0.05em] text-slate-900 sm:text-5xl">
                  Modern college support for every visitor.
                </h1>
                <p className="max-w-md text-base leading-7 text-slate-600">
                  Ask about admissions, courses, placements, campus facilities,
                  and official college information in a cleaner, easier chat
                  experience.
                </p>
              </div>
            </div>

            <div className="relative rounded-[24px] border border-slate-200/70 bg-white/85 p-5 shadow-lg shadow-slate-200/40">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    Assistant online
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    Structured replies, cleaner formatting, and a more polished
                    layout for students and parents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-h-[calc(100vh-2rem)] flex-col rounded-[28px] border border-white/60 bg-white/80 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-4">
          <div className="flex-1 rounded-[24px] border border-slate-200/70 bg-gradient-to-b from-white via-slate-50 to-slate-100/80 p-3 sm:p-4">
            <div className="scrollbar-thin flex h-full flex-col gap-5 overflow-y-auto pr-1">
              {messages.length === 0 && (
                <div className="m-auto w-full max-w-3xl space-y-8 px-2 py-8">
                  <div className="space-y-3">
                    <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wide text-white">
                      Start a conversation
                    </span>
                    <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.04em] text-slate-900">
                      Ask anything about Sri Eshwar College of Engineering
                    </h2>
                    <p className="max-w-2xl text-base leading-7 text-slate-600">
                      Try a suggested prompt below or type your own question to
                      get a concise answer from the assistant.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-left text-sm font-medium leading-6 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => sendMessage(prompt)}
                        disabled={isLoading}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, index) => (
                <article
                  key={`${msg.sender}-${index}`}
                  className={`flex flex-col gap-2 ${
                    msg.sender === "user"
                      ? "ml-auto w-full max-w-2xl items-end"
                      : "mr-auto w-full max-w-3xl items-start"
                  }`}
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-sm font-semibold text-slate-900">
                      {msg.sender === "user" ? "You" : "SECE Assistant"}
                    </span>
                    <span className="text-sm text-slate-500">{msg.time}</span>
                  </div>

                  <div
                    className={`w-full rounded-[24px] px-5 py-4 shadow-sm ${
                      msg.sender === "user"
                        ? "rounded-br-md bg-gradient-to-br from-teal-700 via-teal-700 to-sky-800 text-white"
                        : "rounded-bl-md border border-slate-200 bg-white"
                    }`}
                  >
                    <MessageBody text={msg.text} sender={msg.sender} />
                  </div>
                </article>
              ))}

              {isLoading && (
                <article className="mr-auto w-full max-w-3xl">
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <span className="text-sm font-semibold text-slate-900">
                      SECE Assistant
                    </span>
                    <span className="text-sm text-slate-500">Thinking</span>
                  </div>
                  <div className="inline-flex rounded-[24px] rounded-bl-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400" />
                    </div>
                  </div>
                </article>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <footer className="mt-3 rounded-[24px] border border-slate-200/70 bg-white/95 p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1">
                <span className="sr-only">Ask a question</span>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about admissions, fees, placements, campus life..."
                  disabled={isLoading}
                  rows="1"
                  className="max-h-44 min-h-[56px] w-full resize-none rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>

              <button
                type="button"
                className="inline-flex h-14 min-w-40 items-center justify-center rounded-[18px] bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? "Sending..." : "Send message"}
              </button>
            </div>
          </footer>
        </section>
      </section>
    </main>
  );
}

export default Chat;
