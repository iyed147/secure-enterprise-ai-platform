import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { clearToken } from "../lib/auth";
import type { DocumentResponse, MeResponse } from "../types";
import DocumentUpload from "../components/DocumentUpload";
import DocumentList from "../components/DocumentList";
import ChatPanel from "../components/ChatPanel";
import Card from "../components/ui/Card";

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadDashboard = async () => {
    try {
      const [meRes, docsRes] = await Promise.all([
        api.get<MeResponse>("/api/v1/me"),
        api.get<DocumentResponse[]>("/api/v1/documents"),
      ]);
      setMe(meRes.data);
      setDocs(docsRes.data);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        clearToken();
        navigate("/login", { replace: true });
        return;
      }
      setError(err?.response?.data?.detail || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-slate-400">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-danger bg-danger-light rounded-md px-4 py-3">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {me && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {me.full_name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {me.role.charAt(0).toUpperCase() + me.role.slice(1)} · {me.email}
          </p>
        </div>
      )}

      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Mes documents
        </h2>
        <DocumentUpload onUploaded={loadDashboard} />
        <div className="mt-4">
          <DocumentList documents={docs} onDeleted={loadDashboard} />
        </div>
      </Card>

      <ChatPanel documents={docs} />
    </div>
  );
}