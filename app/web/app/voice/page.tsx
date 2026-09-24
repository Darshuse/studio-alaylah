"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import RecordSheet from "@/components/RecordSheet";
import { api, getToken, getDisplayName, enrollParentVoice, type Character } from "@/lib/api";

const NARRATOR = "الراوي";   // بطاقة الراوي تُعرَف بهذا الوصف (صوته يُستنسخ ويُستخدم لكل الحكايات)
const MIN_SECONDS = 30;       // أقل مدة قراءة لاستنساخ جيّد

function VoiceContent() {
  const router = useRouter();
  const id = useSearchParams().get("id");

  const [text, setText] = useState("");
  const [narrator, setNarrator] = useState<Character | null | undefined>(undefined); // undefined = تحميل
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken() || !id) { router.replace("/login"); return; }
    api.getStory(id).then((s) => setText(s.text || "")).catch(() => setErr("تعذّر تحميل الحكاية."));
    api.listCharacters().then((cs) => setNarrator(cs.find((c) => c.ageLabel === NARRATOR) ?? null)).catch(() => setNarrator(null));
  }, [id, router]);

  const next = () => router.push("/characters?id=" + id);

  // الأب قرأ النص: أنشئ بطاقة الراوي إن لزم، ثم ارفع العيّنة واستنسخ الصوت (مرة واحدة تخدم كل الحكايات)
  const onRecorded = async (blob: Blob) => {
    setBusy(true); setErr(null);
    try {
      const card = narrator ?? await api.createCharacter({ displayName: getDisplayName() || NARRATOR, ageLabel: NARRATOR });
      const res = await enrollParentVoice(card.id, blob);
      if (!res.voiceReady) throw new Error("لم يكتمل استنساخ الصوت.");
      setRecording(false);
      next();
    } catch (e) {
      setRecording(false);
      setErr(e instanceof Error ? e.message : "تعذّر استنساخ الصوت.");
    } finally { setBusy(false); }
  };

  const ready = narrator?.voiceReady === true;

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 px-margin flex items-center gap-space-sm">
          <button onClick={() => router.push("/review?id=" + id)} aria-label="رجوع" className="w-11 h-11 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-low"><Icon name="arrow_forward" size={24} /></button>
          <div className="flex flex-col"><h1 className="text-[17px] font-semibold text-primary">صوت الراوي</h1><span className="text-[12px] text-on-surface-variant">الخطوة 2 — من يحكي الحكاية؟</span></div>
        </div>
      </header>

      <main className="flex flex-col w-full px-margin pt-space-md pb-10 gap-space-md flex-grow">
        {narrator === undefined ? (
          <div className="py-16 flex justify-center text-on-surface-variant"><Icon name="progress_activity" size={28} className="animate-spin" /></div>
        ) : ready ? (
          <>
            <div className="rounded-2xl bg-primary-container text-on-primary p-space-md flex items-center gap-3">
              <span className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center shrink-0"><Icon name="graphic_eq" size={26} fill /></span>
              <div className="flex flex-col">
                <span className="text-[16px] font-bold">صوتك محفوظ ✓</span>
                <span className="text-[13px] text-primary-fixed-dim">الحكاية دي هتتحكي بصوتك — مش محتاج تسجّل تاني.</span>
              </div>
            </div>
            <button onClick={next} className="w-full h-[52px] rounded-full bg-secondary text-on-secondary text-[16px] font-semibold flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(217,130,59,0.35)] active:scale-[0.98]">
              <span>متابعة</span><Icon name="arrow_back" size={20} className="rotate-180" />
            </button>
            <button onClick={() => setRecording(true)} className="w-full h-11 rounded-full bg-surface-container text-primary text-[14px] font-medium flex items-center justify-center gap-2">
              <Icon name="refresh" size={18} /><span>إعادة تسجيل صوتي</span>
            </button>
          </>
        ) : (
          <>
            <section className="flex flex-col gap-1">
              <h2 className="text-[22px] leading-[32px] font-semibold text-primary">اقرأ حكايتك بصوتك</h2>
              <p className="text-[13.5px] text-on-surface-variant leading-relaxed">
                نحتاج نسمع صوتك <b>مرة واحدة فقط</b> ونحفظه، وبعدها كل حكاياتك تتحكي بصوتك — والفيلم يطلع بصوت بابا الحقيقي.
              </p>
            </section>

            <div className="rounded-2xl bg-surface-container-lowest shadow-sm p-space-md flex flex-col gap-2">
              <div className="flex items-center gap-2 text-secondary"><Icon name="menu_book" size={18} fill /><span className="text-[12px] font-bold">النص اللي هتقرأه</span></div>
              <p className="text-[15px] leading-[27px] text-primary whitespace-pre-line max-h-[38vh] overflow-y-auto">{text || "…"}</p>
            </div>

            <ul className="text-[12.5px] text-on-surface-variant flex flex-col gap-1.5">
              <li className="flex items-center gap-2"><Icon name="volume_off" size={16} />اختار مكان هادي بلا ضوضاء.</li>
              <li className="flex items-center gap-2"><Icon name="timer" size={16} />اقرأ بهدوء وبصوتك الطبيعي (حوالي {MIN_SECONDS} ثانية على الأقل).</li>
              <li className="flex items-center gap-2"><Icon name="lock" size={16} />صوتك لعائلتك وحدها، وتقدر تمسحه في أي وقت.</li>
            </ul>

            {err && <p className="text-[13px] text-error bg-error-container/50 rounded-lg px-3 py-2">{err}</p>}

            <button disabled={!text.trim()} onClick={() => setRecording(true)} className="w-full h-[54px] rounded-full bg-secondary text-on-secondary text-[17px] font-semibold flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(217,130,59,0.35)] active:scale-[0.98] disabled:opacity-50">
              <Icon name="mic" size={22} fill /><span>ابدأ القراءة</span>
            </button>
            <button onClick={next} className="w-full h-11 rounded-full text-on-surface-variant text-[13.5px]">متابعة بدون صوتي (فيلم بدون سرد بصوتك)</button>
          </>
        )}
        {ready && err && <p className="text-[13px] text-error bg-error-container/50 rounded-lg px-3 py-2">{err}</p>}
      </main>

      {recording && (
        <RecordSheet
          busy={busy}
          title="اقرأ النص بصوتك"
          subtitle="اقرأه بهدوء كأنك بتحكي لطفلك قبل النوم."
          text={text}
          minSeconds={MIN_SECONDS}
          onClose={() => { if (!busy) setRecording(false); }}
          onDone={onRecorded}
          onSkip={next}
        />
      )}
    </>
  );
}

export default function VoicePage() {
  return <Suspense fallback={<div className="min-h-screen" />}><VoiceContent /></Suspense>;
}
