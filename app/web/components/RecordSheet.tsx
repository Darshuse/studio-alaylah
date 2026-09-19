"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

type Phase = "idle" | "recording" | "recorded" | "error";

function pickMime(): string {
  const c = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of c) if (MediaRecorder.isTypeSupported(m)) return m;
  return "";
}
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function RecordSheet({
  onClose, onDone, onSkip, busy,
}: { onClose: () => void; onDone: (blob: Blob) => void; onSkip: () => void; busy?: boolean }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [errMsg, setErrMsg] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const start = async () => {
    setErrMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        setBlob(b); setAudioUrl(URL.createObjectURL(b)); setPhase("recorded");
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recRef.current = rec;
      rec.start();
      setSeconds(0); setPhase("recording");
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setPhase("error");
      setErrMsg("تعذّر الوصول للميكروفون. تأكد من منح الإذن، أو تابع بدون صوت.");
    }
  };

  const stop = () => { if (timerRef.current) clearInterval(timerRef.current); recRef.current?.stop(); };
  const reset = () => { setBlob(null); if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(null); setSeconds(0); setPhase("idle"); };

  return (
    <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-surface-container-lowest w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-space-lg shadow-xl flex flex-col items-center gap-space-md" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-surface-container-highest sm:hidden" />
        <div className="flex flex-col items-center text-center gap-1">
          <h3 className="text-[20px] font-semibold text-primary">سجّل حكايتك بصوتك</h3>
          <p className="text-[13px] text-on-surface-variant">تحدّث بعفوية — والشاشة شغّالة أثناء التسجيل.</p>
        </div>

        {/* Mic circle + waveform */}
        <div className="relative w-28 h-28 rounded-full bg-primary-container flex items-center justify-center my-2">
          {phase === "recording" && <div className="absolute inset-0 rounded-full bg-secondary-container/30 animate-ping" />}
          <Icon name={phase === "recording" ? "graphic_eq" : "mic"} size={44} fill className="text-secondary-container" />
        </div>

        {phase !== "error" && <div className="text-[22px] font-bold text-primary tabular-nums">{fmt(seconds)}</div>}

        {phase === "recording" && (
          <div className="flex items-center gap-1 h-6">
            {[3, 6, 4, 8, 5, 7, 3, 6, 4, 5].map((h, i) => (
              <span key={i} className="w-1 rounded-full bg-secondary animate-pulse" style={{ height: h * 3, animationDelay: `${i * 90}ms` }} />
            ))}
          </div>
        )}

        {phase === "recorded" && audioUrl && (
          <audio controls src={audioUrl} className="w-full" />
        )}

        {phase === "error" && <p className="text-[13px] text-error bg-error-container/50 rounded-lg px-3 py-2 text-center">{errMsg}</p>}

        {/* Actions */}
        <div className="w-full flex flex-col gap-2.5 mt-1">
          {phase === "idle" && (
            <button onClick={start} className="w-full h-[52px] rounded-full bg-secondary text-on-secondary text-[17px] font-semibold flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(217,130,59,0.35)] active:scale-[0.98]">
              <Icon name="fiber_manual_record" size={22} fill /><span>ابدأ التسجيل</span>
            </button>
          )}
          {phase === "recording" && (
            <button onClick={stop} className="w-full h-[52px] rounded-full bg-primary-container text-on-primary text-[17px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98]">
              <Icon name="stop" size={22} fill /><span>إيقاف</span>
            </button>
          )}
          {phase === "recorded" && (
            <>
              <button disabled={busy} onClick={() => blob && onDone(blob)} className="w-full h-[52px] rounded-full bg-primary-container text-on-primary text-[17px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60">
                <Icon name={busy ? "progress_activity" : "check"} size={22} className={busy ? "animate-spin" : ""} /><span>{busy ? "جارٍ الرفع..." : "استخدام هذا التسجيل"}</span>
              </button>
              <button disabled={busy} onClick={reset} className="w-full h-11 rounded-full bg-surface-container text-primary text-[14px] font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                <Icon name="refresh" size={18} /><span>إعادة التسجيل</span>
              </button>
            </>
          )}
          {phase === "error" && (
            <button onClick={onSkip} className="w-full h-[52px] rounded-full bg-primary-container text-on-primary text-[17px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98]">
              <span>متابعة بدون صوت</span><Icon name="arrow_back" size={20} />
            </button>
          )}
          <button onClick={onClose} className="w-full h-10 rounded-full text-on-surface-variant text-[14px]">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
