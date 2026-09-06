import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import Button from "./ui/Button";

type Props = {
  onCapture: (base64: string) => Promise<void> | void;
  buttonLabel?: string;
  disabled?: boolean;
};

let cachedLandmarker: FaceLandmarker | null = null;

async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (cachedLandmarker) return cachedLandmarker;

  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );

  cachedLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
  });

  return cachedLandmarker;
}

export default function WebcamCapture({
  onCapture,
  buttonLabel = "Capture",
  disabled = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    streamRef.current = stream;
    setStreaming(true);
  };

  const stopCamera = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
    setFaceDetected(false);
  };

  useEffect(() => {
    if (!streaming || !videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});

    let landmarker: FaceLandmarker | null = null;
    let cancelled = false;

    const runDetectionLoop = async () => {
      landmarker = await getFaceLandmarker();
      if (cancelled) return;

      const detectFrame = () => {
        if (cancelled || !videoRef.current || !overlayCanvasRef.current || !landmarker) return;

        const overlay = overlayCanvasRef.current;
        const vid = videoRef.current;

        if (vid.videoWidth === 0) {
          animationFrameRef.current = requestAnimationFrame(detectFrame);
          return;
        }

        overlay.width = vid.videoWidth;
        overlay.height = vid.videoHeight;
        const ctx = overlay.getContext("2d");
        if (!ctx) return;

        const result = landmarker.detectForVideo(vid, performance.now());
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (result.faceLandmarks.length > 0) {
          setFaceDetected(true);
          const landmarks = result.faceLandmarks[0];

          // Points du visage — petits cercles pulsants indigo
          ctx.fillStyle = "rgba(79, 70, 229, 0.85)";
          for (const point of landmarks) {
            const x = point.x * overlay.width;
            const y = point.y * overlay.height;
            ctx.beginPath();
            ctx.arc(x, y, 1.4, 0, 2 * Math.PI);
            ctx.fill();
          }
        } else {
          setFaceDetected(false);
        }

        animationFrameRef.current = requestAnimationFrame(detectFrame);
      };

      detectFrame();
    };

    runDetectionLoop();

    return () => {
      cancelled = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [streaming]);

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
              autoPlay
              muted
              playsInline
            />

            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none"
            />

            <div
              className={`absolute inset-0 rounded-full border-4 transition-colors duration-300 ${
                faceDetected ? "border-success/70" : "border-primary/60"
              }`}
            />
            <div className="absolute inset-2 rounded-full border-2 border-primary/30 animate-corner-pulse" />

            {!faceDetected && (
              <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                <div className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_12px_2px_rgba(79,70,229,0.8)] animate-scan-line" />
              </div>
            )}

            {busy && (
              <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">Analyse...</span>
              </div>
            )}
          </div>

          <p className={`text-xs font-medium transition-colors ${faceDetected ? "text-success" : "text-slate-400"}`}>
            {faceDetected ? "✓ Visage détecté" : "Positionnez votre visage dans le cadre..."}
          </p>

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