import { useEffect, useRef, useState } from "react";
import Button from "./ui/Button";

type Props = {
  onCapture: (base64: string) => Promise<void> | void;
  buttonLabel?: string;
  disabled?: boolean;
};

export default function WebcamCapture({
  onCapture,
  buttonLabel = "Capture",
  disabled = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [busy, setBusy] = useState(false);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStreaming(true);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setBusy(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const base64 = dataUrl.split(",")[1];
      await onCapture(base64);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!streaming ? (
        <Button type="button" variant="secondary" fullWidth onClick={startCamera} disabled={disabled || busy}>
          Ouvrir la caméra
        </Button>
      ) : (
        <>
          <div className="relative w-64 h-64 rounded-full overflow-hidden bg-slate-900 shadow-elevated">
            <video
              ref={videoRef}
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* Anneau Face ID */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/60" />
            <div className="absolute inset-2 rounded-full border-2 border-primary/30 animate-corner-pulse" />

            {/* Ligne de scan */}
            <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
              <div className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_12px_2px_rgba(79,70,229,0.8)] animate-scan-line" />
            </div>

            {busy && (
              <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">Analyse...</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 w-full max-w-xs">
            <Button type="button" fullWidth onClick={capture} disabled={disabled || busy}>
              {busy ? "Traitement..." : buttonLabel}
            </Button>
            <Button type="button" variant="secondary" onClick={stopCamera} disabled={busy}>
              Fermer
            </Button>
          </div>
        </>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}