import { useState } from "react";
import type { FormEvent } from "react";
import { getToken } from "../lib/auth";
import type { ChatSource, DocumentResponse } from "../types";

type Props = {
  documents: DocumentResponse[];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function ChatPanel({ documents }: Props) {
  const [question, setQuestion] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamedAnswer, setStreamedAnswer] = useState("");
  const [sources, setSources] = useState<ChatSource[]>([]);
  const [error, setError] = useState<string | null>(null);

  const processedDocs = documents.filter((d) => d.status === "processed");

  const toggleDoc = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStreamedAnswer("");
    setSources([]);

    if (!question.trim()) {
      setError("Écris une question.");
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/v1/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          question: question.trim(),
          document_ids: selectedIds.length > 0 ? selectedIds : null,
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
          const jsonStr = line.slice(6);
          const event = JSON.parse(jsonStr);

          if (event.type === "sources") {
            setSources(event.sources);
          } else if (event.type === "token") {
            setStreamedAnswer((prev) => prev + event.content);
          } else if (event.type === "done") {
            // fin du flux
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || "Échec de la requête.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 20, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <h4>AI Knowledge Assistant</h4>

      {processedDocs.length === 0 ? (
        <p style={{ color: "#888", fontSize: 14 }}>
          Aucun document traité disponible pour l'instant.
        </p>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
            Restreindre la recherche à des documents précis (optionnel) :
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 150, overflowY: "auto" }}>
            {processedDocs.map((doc) => (
              <label key={doc.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(doc.id)}
                  onChange={() => toggleDoc(doc.id)}
                />
                {doc.title}
              </label>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Pose ta question..."
          style={{ flex: 1, padding: 8 }}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "..." : "Ask"}
        </button>
      </form>

      {error && <p style={{ color: "crimson", marginTop: 8 }}>{error}</p>}

      {(streamedAnswer || loading) && (
        <div style={{ marginTop: 16 }}>
          <div style={{ padding: 10, backgroundColor: "#f5f5f5", borderRadius: 6, whiteSpace: "pre-wrap", minHeight: 24 }}>
            {streamedAnswer}
            {loading && <span style={{ opacity: 0.5 }}>▌</span>}
          </div>

          {sources.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <strong style={{ fontSize: 13 }}>Sources :</strong>
              <ul style={{ marginTop: 4, paddingLeft: 18, fontSize: 13, color: "#555" }}>
                {sources.map((s, i) => (
                  <li key={i}>
                    {s.document_title} — Page {s.page}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}