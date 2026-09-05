import { api } from "../lib/api";
import type { DocumentResponse } from "../types";
import Badge from "./ui/Badge";

type Props = {
  documents: DocumentResponse[];
  onDeleted: () => void;
};

function statusVariant(status: string): "success" | "danger" | "warning" {
  if (status === "processed") return "success";
  if (status === "failed") return "danger";
  return "warning";
}

function statusLabel(status: string): string {
  if (status === "processed") return "Prêt";
  if (status === "failed") return "Échec";
  return "En traitement";
}

function cleanTitle(doc: DocumentResponse): string {
  return doc.title || doc.file_name.replace(/^[a-f0-9]{8}_/, "");
}

export default function DocumentList({ documents, onDeleted }: Props) {
  const onDelete = async (id: number) => {
    if (!confirm("Supprimer ce document définitivement ?")) return;
    try {
      await api.delete(`/api/v1/documents/${id}`);
      onDeleted();
    } catch (err) {
      alert("Échec de la suppression.");
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-2">📭</div>
        <p className="text-sm text-slate-400">Aucun document pour l'instant.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="group flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-primary/40 hover:shadow-card transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center text-white text-lg flex-shrink-0 shadow-sm">
              📕
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{cleanTitle(doc)}</p>
              <p className="text-xs text-slate-400">PDF</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Badge variant={statusVariant(doc.status)}>{statusLabel(doc.status)}</Badge>
            <button
              onClick={() => onDelete(doc.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-danger transition-all"
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}