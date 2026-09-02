import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import type { DocumentUploadResponse } from "../types";

const ROLES = ["developer", "hr", "finance"];

type Props = {
  onUploaded?: () => void;
};

export default function DocumentUpload({ onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleRole = (role: string) => {
    setAllowedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!file) {
      setError("Sélectionne un fichier PDF.");
      return;
    }
    if (allowedRoles.length === 0) {
      setError("Sélectionne au moins un rôle autorisé.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (title.trim()) formData.append("title", title.trim());
    formData.append("allowed_roles", allowedRoles.join(","));

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
      setAllowedRoles([]);
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

        <label>Rôles autorisés</label>
        <div style={{ display: "flex", gap: 12 }}>
          {ROLES.map((role) => (
            <label key={role} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="checkbox"
                checked={allowedRoles.includes(role)}
                onChange={() => toggleRole(role)}
              />
              {role}
            </label>
          ))}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Upload en cours..." : "Uploader"}
        </button>
      </form>

      {message && <p style={{ color: "green", marginTop: 8 }}>{message}</p>}
      {error && <p style={{ color: "crimson", marginTop: 8 }}>{error}</p>}
    </div>
  );
}