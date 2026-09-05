import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import type { DocumentUploadResponse } from "../types";
import Button from "./ui/Button";
import Input from "./ui/Input";

type Props = {
  onUploaded?: () => void;
};

export default function DocumentUpload({ onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type === "application/pdf") {
      setFile(dropped);
    }
  };

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
      setMessage(`"${data.title}" ajouté avec succès.`);
      setFile(null);
      setTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUploaded?.();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Échec de l'upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-colors
          ${dragActive ? "border-primary bg-primary-light" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        <div className="text-3xl mb-2">📄</div>
        {file ? (
          <p className="text-sm font-semibold text-slate-800">{file.name}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-600">
              Glisse un PDF ici ou clique pour sélectionner
            </p>
            <p className="text-xs text-slate-400 mt-1">Sera associé à votre compte automatiquement</p>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre (optionnel)"
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !file}>
          {loading ? "Envoi..." : "Uploader"}
        </Button>
      </div>

      {message && (
        <p className="text-sm text-success bg-success-light rounded-md px-3 py-2">{message}</p>
      )}
      {error && (
        <p className="text-sm text-danger bg-danger-light rounded-md px-3 py-2">{error}</p>
      )}
    </form>
  );
}