import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import type { DocumentUploadResponse } from "../types";

type Props = {
  onUploaded?: () => void;
};

export default function DocumentUpload({ onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!file) {
      setError("Sélectionne un fichier PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (title.trim()) formData.append("title", title.trim());

    setLoading(true);
    try {
      const { data } = await api.post<DocumentUploadResponse>(
        "/api/v1/documents/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessage(`"${data.title}" uploadé avec succès (status: ${data.status}).`);
      setFile(null);
      setTitle("");
      onUploaded?.();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Échec de l'upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <h4>+ Insert Company Document</h4>
      <p style={{ fontSize: 13, color: "#666", marginTop: -4 }}>
        Ce document sera automatiquement associé à votre département.
      </p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
        <label>Fichier PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <label>Titre (optionnel)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Laisser vide = nom du fichier"
        />

        <button type="submit" disabled={loading}>
          {loading ? "Upload en cours..." : "Uploader"}
        </button>
      </form>

      {message && <p style={{ color: "green", marginTop: 8 }}>{message}</p>}
      {error && <p style={{ color: "crimson", marginTop: 8 }}>{error}</p>}
    </div>
  );
}