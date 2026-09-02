import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { clearToken } from "../lib/auth";
import type { DocumentResponse, FaceEnrollResponse, MeResponse } from "../types";
import WebcamCapture from "../components/WebcamCapture";
import DocumentUpload from "../components/DocumentUpload";

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollMsg, setEnrollMsg] = useState<string | null>(null);
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
        navigate("/login");
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

  const onFaceCaptureEnroll = async (image_base64: string) => {
    setEnrollMsg(null);
    setEnrollLoading(true);
    try {
      const { data } = await api.post<FaceEnrollResponse>("/api/v1/auth/enroll-face", { image_base64 });
      setEnrollMsg(data.message || "Face enrolled.");
    } catch (err: any) {
      setEnrollMsg(err?.response?.data?.detail || "Face enroll failed");
    } finally {
      setEnrollLoading(false);
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;

  return (
    <div>
      <h2>Dashboard</h2>
      {me && (
        <div style={{ marginBottom: 16 }}>
          <p><strong>Welcome:</strong> {me.full_name}</p>
          <p><strong>Role:</strong> {me.role}</p>
          <p><strong>Email:</strong> {me.email}</p>
        </div>
      )}

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <h4>Face ID Enrollment</h4>
        <WebcamCapture onCapture={onFaceCaptureEnroll} buttonLabel="Enrôler mon visage" disabled={enrollLoading} />
        {enrollMsg && <p style={{ marginTop: 8 }}>{enrollMsg}</p>}
      </div>

      <DocumentUpload onUploaded={loadDashboard} />

      <h3 style={{ marginTop: 20 }}>Documents autorisés</h3>
      <ul>
        {docs.map((doc) => (
          <li key={doc.id}>
            {doc.file_name} — <em>{doc.owner_role}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}