import { useEffect, useRef, useState } from "react";

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
  const [streaming, setStreaming] = useState(false);
  const [busy, setBusy] = useState(false);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStreaming(true);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
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
    <div style={{ display: "grid", gap: 8 }}>
      {!streaming ? (
        <button type="button" onClick={startCamera} disabled={disabled || busy}>
          Ouvrir la caméra
        </button>
      ) : (
        <>
          <video ref={videoRef} style={{ width: 320, borderRadius: 8, border: "1px solid #ccc" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={capture} disabled={disabled || busy}>
              {busy ? "Traitement..." : buttonLabel}
            </button>
            <button type="button" onClick={stopCamera} disabled={busy}>
              Fermer la caméra
            </button>
          </div>
        </>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}