import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";
import type { AuthResponse, MockLoginResponse } from "../types";

const demoEmails = [
  "iyed.dev@enterprise.local",
  "sarah.hr@enterprise.local",
  "omar.finance@enterprise.local",
];

export default function LoginPage() {
  const [email, setEmail] = useState(demoEmails[0]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mockLoading, setMockLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>("/api/v1/auth/login", {
        email,
        password,
      });
      setToken(data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const onMockLogin = async () => {
    setError(null);
    setMockLoading(true);
    try {
      const { data } = await api.post<MockLoginResponse>("/api/v1/auth/mock-login", {
        email,
      });
      setToken(data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Mock login failed");
    } finally {
      setMockLoading(false);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <p>Connecte-toi avec un compte seedé.</p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <label>Email</label>
        <select value={email} onChange={(e) => setEmail(e.target.value)}>
          {demoEmails.map((em) => (
            <option key={em} value={em}>
              {em}
            </option>
          ))}
        </select>

        <label>Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passw0rd!"
        />

        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}

      <hr style={{ margin: "20px 0" }} />

      <details>
        <summary style={{ cursor: "pointer" }}>Mode développeur</summary>
        <p style={{ fontSize: 13, color: "#666" }}>
          Connexion rapide sans mot de passe (mock-login, pour tests uniquement).
        </p>
        <button onClick={onMockLogin} disabled={mockLoading}>
          {mockLoading ? "Connexion..." : "Mock login (dev)"}
        </button>
      </details>
    </div>
  );
}