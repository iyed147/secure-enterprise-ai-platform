import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { clearToken } from "../lib/auth";
import type { DocumentResponse, MeResponse } from "../types";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, docsRes] = await Promise.all([
          api.get<MeResponse>("/api/v1/me"),
          api.get<DocumentResponse[]>("/api/v1/documents"),
        ]);
        setMe(meRes.data);
        setDocs(docsRes.data);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401) {
          clearToken();
          navigate("/login");
          return;
        }
        setError(err?.response?.data?.detail || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;

  return (
    <div>
      <h2>Dashboard</h2>
      {me && (
        <div style={{ marginBottom: 16 }}>
          <p>
            <strong>Welcome:</strong> {me.full_name}
          </p>
          <p>
            <strong>Role:</strong> {me.role}
          </p>
          <p>
            <strong>Email:</strong> {me.email}
          </p>
        </div>
      )}
      <h3>Documents autorisés</h3>
      {docs.length === 0 ? (
        <p>Aucun document autorisé.</p>
      ) : (
        <ul>
          {docs.map((doc) => (
            <li key={doc.id}>
              {doc.file_name} — <em>{doc.owner_role}</em>
            </li>
          ))}
        </ul>
      )}
      <hr />
      <h3>AI Knowledge Assistant (placeholder)</h3>
      <p>Le module chat arrive à l'épisode suivant.</p>
    </div>
  );
}