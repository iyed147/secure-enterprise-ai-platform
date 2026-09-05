import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import { setToken } from "../lib/auth";
import type { AuthResponse, FaceLoginResponse } from "../types";
import WebcamCapture from "../components/WebcamCapture";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const navigate = useNavigate();

    const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>("/api/v1/auth/login", { email, password });
      setToken(data.access_token);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

    const onFaceCaptureLogin = async (image_base64: string) => {
    setError(null);
    setFaceLoading(true);
    try {
      const { data } = await api.post<FaceLoginResponse>("/api/v1/auth/login-face", { image_base64 });
      setToken(data.access_token);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Face login failed");
    } finally {
      setFaceLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-12 bg-slate-50">
      <Card className="w-full max-w-md" padding="lg">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
        <p className="text-sm text-slate-500 mb-6">Log in to access your workspace</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        {error && (
          <p className="text-sm text-danger bg-danger-light rounded-md px-3 py-2 mt-4">{error}</p>
        )}

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <p className="text-sm font-semibold text-slate-700 text-center mb-4">Login with Face ID</p>
        <WebcamCapture onCapture={onFaceCaptureLogin} buttonLabel="Se connecter" disabled={faceLoading} />

        <p className="text-sm text-slate-500 text-center mt-6">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Créer un compte
          </Link>
        </p>
      </Card>
    </div>
  );
}