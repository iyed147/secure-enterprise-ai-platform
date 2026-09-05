import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setToken, getToken } from "../lib/auth";
import type { AuthResponse, FaceEnrollResponse } from "../types";
import WebcamCapture from "../components/WebcamCapture";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const roles = [
  { value: "developer", label: "Developer" },
  { value: "hr", label: "HR" },
  { value: "finance", label: "Finance" },
];

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState(roles[0].value);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceMessage, setFaceMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmitAccount = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>("/api/v1/auth/register", {
        full_name: fullName,
        email,
        password,
        role,
      });
      setToken(data.access_token);
      setStep(2); // passe à l'étape capture visage
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

    const onFaceCapture = async (image_base64: string) => {
    setFaceMessage(null);
    setFaceLoading(true);
    try {
      const { data } = await api.post<FaceEnrollResponse>("/api/v1/auth/enroll-face", { image_base64 });
      setFaceMessage(data.message || "Visage enregistré avec succès.");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1200);
    } catch (err: any) {
      setFaceMessage(err?.response?.data?.detail || "Échec de l'enregistrement du visage.");
    } finally {
      setFaceLoading(false);
    }
  };

  const skipFaceEnrollment = () => {
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-12 bg-slate-50">
      <Card className="w-full max-w-md" padding="lg">
        {/* Indicateur d'étapes */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-slate-200"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-slate-200"}`} />
        </div>

        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h2>
            <p className="text-sm text-slate-500 mb-6">Step 1 of 2 — Account details</p>

            <form onSubmit={onSubmitAccount} className="flex flex-col gap-4">
              <Input
                label="Nom complet"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@enterprise.local"
                required
              />
              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Confirmer le mot de passe"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-500">Rôle</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-3.5 py-2.5 rounded-md text-sm border border-slate-200 outline-none focus:border-primary transition-colors"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Création..." : "Continuer"}
              </Button>
            </form>

            {error && (
              <p className="text-sm text-danger bg-danger-light rounded-md px-3 py-2 mt-4">{error}</p>
            )}

            <p className="text-sm text-slate-500 text-center mt-6">
              Déjà un compte ?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Ajoutez votre visage</h2>
            <p className="text-sm text-slate-500 mb-6">
              Step 2 of 2 — Activez la connexion par reconnaissance faciale (optionnel)
            </p>

            <WebcamCapture onCapture={onFaceCapture} buttonLabel="Enregistrer mon visage" disabled={faceLoading} />

            {faceMessage && (
              <p className="text-sm text-center mt-4 text-slate-700 bg-slate-100 rounded-md px-3 py-2">
                {faceMessage}
              </p>
            )}

            <button
              onClick={skipFaceEnrollment}
              className="text-sm text-slate-400 hover:text-slate-600 text-center w-full mt-6 transition-colors"
            >
              Passer cette étape pour l'instant
            </button>
          </>
        )}
      </Card>
    </div>
  );
}