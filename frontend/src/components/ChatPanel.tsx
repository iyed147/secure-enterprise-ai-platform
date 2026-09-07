import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { getToken } from "../lib/auth";
import type { ChatSource, DocumentResponse } from "../types";
import Card from "./ui/Card";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
};

type Props = {
  documents: DocumentResponse[];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function ChatPanel({ documents }: Props) {
  const [question, setQuestion] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const processedDocs = documents.filter((d) => d.status === "processed");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const toggleDoc = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const newConversation = () => {
    setMessages([]);
    setSelectedIds([]);
    setError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const q = question.trim();
    if (!q) return;

    const historyPayload = messages
      .filter((m) => m.content.trim() !== "")
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuestion("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "", sources: [] }]);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/v1/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          question: q,
          document_ids: selectedIds.length > 0 ? selectedIds : null,
          history: historyPayload,
        }),
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || "Échec de la requête.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6));

          if (event.type === "sources") {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, sources: event.sources };
              return updated;
            });
          } else if (event.type === "token") {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, content: last.content + event.content };
              return updated;
            });
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || "Échec de la requête.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="sm" className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <img
            src="/robot_photo.jpg"
            alt="AI Assistant"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20"
          />
          <div>
            <p className="text-sm font-semibold text-slate-800">AI Knowledge Assistant</p>
            <p className="text-xs text-slate-400">
              {selectedIds.length > 0 ? `${selectedIds.length} document(s) sélectionné(s)` : "Tous vos documents"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDocPicker((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary px-3 py-1.5 rounded-full border border-slate-200 hover:border-primary/40 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Documents
          </button>
          <button
            onClick={newConversation}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary px-3 py-1.5 rounded-full border border-slate-200 hover:border-primary/40 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle discussion
          </button>
        </div>
      </div>

      {/* Sélecteur de documents (collapsible) */}
      {showDocPicker && (
        <div className="px-3 py-3 border-b border-slate-100 bg-slate-50">
          {processedDocs.length === 0 ? (
            <p className="text-xs text-slate-400">Aucun document traité disponible.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {processedDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className={`
                    text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                    ${selectedIds.includes(doc.id)
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}
                  `}
                >
                  {doc.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Zone de messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <img src="/robot_photo.jpg" alt="" className="w-16 h-16 rounded-full object-cover opacity-90" />
            <p className="text-sm text-slate-400">Posez une question sur vos documents</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <img
                src="/robot_photo.jpg"
                alt=""
                className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-1 ring-primary/20"
              />
            )}
            <div className={`max-w-[75%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`
                  px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed
                  ${msg.role === "user"
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-800 rounded-bl-sm"}
                `}
              >
                {msg.content || (loading && i === messages.length - 1 ? (
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  </span>
                ) : null)}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-1 px-1">
                  {[...new Map(msg.sources.map((s) => [s.document_title, s])).values()].map((s, j) => (
                    <span key={j} className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {s.document_title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-xs text-danger bg-danger-light rounded-md px-3 py-2 mx-3 mb-2">{error}</p>
      )}

      {/* Input */}
      <form onSubmit={onSubmit} className="flex gap-2 p-3 border-t border-slate-100">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Écrivez votre message..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 text-sm outline-none focus:border-primary transition-colors disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 hover:bg-primary-hover hover:scale-105 transition-all flex-shrink-0 shadow-md"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </form>
    </Card>
  );
}