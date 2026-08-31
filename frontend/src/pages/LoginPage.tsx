import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";
import type { MockLoginResponse } from "../types";

const demoEmails = [
  "iyed.dev@enterprise.local",
  "sarah.hr@enterprise.local",
  "omar.finance@enterprise.local",
];

export default function LoginPage() {
  const [email, setEmail] = useState(demoEmails[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await api.post<MockLoginResponse>("/api/v1/auth/mock-login", { email });
      setToken(data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;

      let message = "Login failed";
      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail
          .map((d: any) => d?.msg)
          .filter(Boolean)
          .join(" | ");
      } else if (detail && typeof detail === "object" && "msg" in detail) {
        message = String(detail.msg);
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Mock Login</h2>
      <p>Sélectionne un utilisateur seedé pour tester RBAC.</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <label>Email</label>
        <select value={email} onChange={(e) => setEmail(e.target.value)}>
          {demoEmails.map((em) => (
            <option key={em} value={em}>
              {em}
            </option>
          ))}
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
    </div>
  );
}