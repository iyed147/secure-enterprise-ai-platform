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
        <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-1.414 1.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 006.586 13H4" />
        </svg>
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}