import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";
import type { AuthResponse, MockLoginResponse } from "../types";

export default function LoginPage() {
  const [email, setEmail] = useState("");
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
      <p>Connecte-toi avec ton compte.</p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="iyed.dev@enterprise.local"
          required
        />

        <label>Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passw0rd!"
          required
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
          Connexion rapide sans mot de passe (mock-login, pour tests uniquement). Renseigne l'email ci-dessus puis clique ici.
        </p>
        <button onClick={onMockLogin} disabled={mockLoading || !email}>
          {mockLoading ? "Connexion..." : "Mock login (dev)"}
        </button>
      </details>

      <p style={{ marginTop: 16, fontSize: 14 }}>
        Pas encore de compte ? <Link to="/register">Créer un compte</Link>
      </p>
    </div>
  );
}