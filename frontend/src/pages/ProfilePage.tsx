import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { clearToken } from "../lib/auth";
import type { ChangePasswordResponse, FaceEnrollResponse } from "../types";
import WebcamCapture from "../components/WebcamCapture";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function ProfilePage() {
  const navigate = useNavigate();

  // Changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  // Re-capture visage
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceMessage, setFaceMessage] = useState<string | null>(null);

  // Suppression de compte
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwMessage(null);

    if (newPassword !== confirmNewPassword) {
      setPwError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setPwLoading(true);
    try {
      const { data } = await api.post<ChangePasswordResponse>("/api/v1/me/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwMessage(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setPwError(err?.response?.data?.detail || "Échec de la mise à jour.");
    } finally {
      setPwLoading(false);
    }
  };

  const onFaceCapture = async (image_base64: string) => {
    setFaceMessage(null);
    setFaceLoading(true);
    try {
      const { data } = await api.post<FaceEnrollResponse>("/api/v1/auth/enroll-face", { image_base64 });
      setFaceMessage(data.message || "Visage mis à jour avec succès.");
    } catch (err: any) {
      setFaceMessage(err?.response?.data?.detail || "Échec de l'enregistrement.");
    } finally {
      setFaceLoading(false);
    }
  };

  const onDeleteAccount = async () => {
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await api.delete("/api/v1/me", { data: { password: deletePassword } });
      clearToken();
      navigate("/", { replace: true });
    } catch (err: any) {
      setDeleteError(err?.response?.data?.detail || "Échec de la suppression.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profil</h1>

      {/* Changer mot de passe */}
      <Card>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Mot de passe
        </h2>
        <form onSubmit={onChangePassword} className="flex flex-col gap-3">
          <Input
            label="Mot de passe actuel"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="Nouveau mot de passe"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirmer le nouveau mot de passe"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={pwLoading} className="self-start mt-1">
            {pwLoading ? "Mise à jour..." : "Mettre à jour"}
          </Button>
        </form>
        {pwMessage && (
          <p className="text-sm text-success bg-success-light rounded-md px-3 py-2 mt-3">{pwMessage}</p>
        )}
        {pwError && (
          <p className="text-sm text-danger bg-danger-light rounded-md px-3 py-2 mt-3">{pwError}</p>
        )}
      </Card>

      {/* Re-capture visage */}
      <Card>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Face ID
        </h2>
        <WebcamCapture onCapture={onFaceCapture} buttonLabel="Mettre à jour mon visage" disabled={faceLoading} />
        {faceMessage && (
          <p className="text-sm text-slate-700 bg-slate-100 rounded-md px-3 py-2 mt-3 text-center">{faceMessage}</p>
        )}
      </Card>

      {/* Suppression de compte */}
      <Card className="border-danger/30">
        <h2 className="text-sm font-semibold text-danger uppercase tracking-wide mb-2">
          Zone de danger
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Supprimer votre compte effacera définitivement vos documents et votre historique. Cette action est irréversible.
        </p>

        {!showDeleteConfirm ? (
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            Supprimer mon compte
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <Input
              label="Confirmez avec votre mot de passe"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
            {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
            <div className="flex gap-2">
              <Button variant="danger" onClick={onDeleteAccount} disabled={deleteLoading || !deletePassword}>
                {deleteLoading ? "Suppression..." : "Confirmer la suppression"}
              </Button>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}