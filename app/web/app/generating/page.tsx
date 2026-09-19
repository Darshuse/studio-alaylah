"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import { api } from "@/lib/api";

// خطوات تتبع التقدّم الحقيقي (done عند تجاوز العتبة)
const STEP_DEFS = [
  { icon: "hearing", at: 8,   t: "تجهيز الحكاية", d: "نقرأ نصك ونرتّب مشاهده بعناية" },
  { icon: "palette", at: 35,  t: "رسم الشخصيات بطابع الألوان المائية", d: "ملامح هادئة تحفظ خصوصية العائلة" },
  { icon: "movie", at: 85,    t: "تنسيق المشاهد وتوليف النغمات", d: "نصنع كل مشهد ونضيف اللمسات الأخيرة" },
  { icon: "bookmark", at: 100, t: "إعداد العرض النهائي", d: "تجليد الألبوم ليكون جاهزًا للمشاهدة" },
];

function GeneratingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const storyId = params.get("id");
  const jobId = params.get("job");
  const [progress, setProgress] = useState(jobId ? 0 : 75);
  const [failed, setFailed] = useState(false);
  const done = progress >= 100;
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (jobId) {
      // استطلاع المهمة الحقيقية على الخادم
      poll.current = setInterval(async () => {
        try {
          const j = await api.getJob(jobId);
          setProgress(j.progress);
          if (j.status === "completed") { setProgress(100); if (poll.current) clearInterval(poll.current); }
          if (j.status === "failed") { setFailed(true); if (poll.current) clearInterval(poll.current); }
        } catch {}
      }, 1000);
      return () => { if (poll.current) clearInterval(poll.current); };
    }
    // وضع العرض التوضيحي بدون job
    const t = setInterval(() => setProgress((p) => (p >= 100 ? 100 : p + 1)), 400);
    return () => clearInterval(t);
  }, [jobId]);

  const goPlayer = () => router.push("/player" + (storyId ? "?id=" + storyId : ""));

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <button onClick={() => router.push("/art-style")} className="w-11 h-11 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-low"><Icon name="arrow_forward" size={24} /></button>
            <div className="flex flex-col"><h1 className="text-[17px] font-semibold text-primary">تجهيز الفيلم</h1><span className="text-[12px] text-on-surface-variant">استوديو حكايات العائلة</span></div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-secondary-container shadow"><Icon name="auto_stories" size={18} fill /></div>
        </div>
      </header>

      <main className="flex flex-col w-full px-margin pt-space-md pb-8 flex-grow">
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[12px] mb-3 shadow-sm"><Icon name="auto_stories" size={16} fill /><span>غرفة الحياكة العائلية</span></span>
          <h2 className="text-[22px] leading-[32px] font-semibold text-primary tracking-tight">نجهّز حكايتكم العائلية بعناية...</h2>
          <p className="text-[13px] text-on-surface-variant max-w-xs mt-1">نجمع خيوط الذكريات وأصوات الضحكات في سجل عائلي خالد ومصوّر</p>
        </div>

        {/* Progress card */}
        <div className="relative w-full rounded-2xl bg-surface-container-lowest p-6 shadow-md mb-6 overflow-hidden flex flex-col items-center">
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-secondary-container/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-primary-fixed/30 blur-2xl pointer-events-none" />
          <div className="relative w-full max-w-[200px] aspect-square flex items-center justify-center mb-4">
            <div className="w-28 h-28 rounded-full border-4 border-surface-container-high border-t-secondary animate-spin" style={{ animationDuration: "2.4s" }} />
            <Icon name="menu_book" size={40} fill className="absolute text-primary" />
          </div>
          <div className="w-full flex items-center justify-between text-[14px] mb-2">
            <span className="text-primary font-semibold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary-container animate-ping" />{done ? "اكتملت الحياكة" : "جارٍ صنع مشاهدك"}</span>
            <span className="text-secondary font-bold text-[17px]">{progress}٪</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden p-0.5">
            <div className="h-full rounded-full bg-gradient-to-l from-secondary-container via-secondary to-primary-container transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Steps — تتبع التقدّم الحقيقي */}
        <div className="flex flex-col gap-3 mb-6">
          {STEP_DEFS.map((s, i) => {
            const isDone = progress >= s.at;
            const activeIdx = STEP_DEFS.findIndex((x) => progress < x.at);
            const isActive = i === activeIdx;
            const isSoon = !isDone && !isActive;
            const state = isDone ? "done" : isActive ? "active" : "soon";
            const right = isDone ? "مكتملة" : isActive ? "جارية الآن" : "قريبًا";
            return (
              <div key={i} className={`flex items-start gap-3.5 p-3.5 rounded-2xl shadow-sm ${state === "active" ? "bg-secondary-fixed/30" : state === "soon" ? "bg-surface-container-low opacity-75" : "bg-surface-container-lowest"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${state === "done" ? "bg-primary-fixed text-primary" : state === "active" ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-highest text-outline"}`}>
                  <Icon name={isDone ? "check" : s.icon} size={18} fill={state !== "soon"} className={state === "active" ? "animate-spin" : ""} />
                </div>
                <div className="flex flex-col min-w-0 flex-grow">
                  <div className="flex items-center justify-between">
                    <p className={`text-[17px] ${state === "active" ? "font-semibold text-on-surface" : state === "soon" ? "text-on-surface-variant" : "text-on-surface"}`}>{s.t}</p>
                    <span className={`text-[12px] font-medium ${state === "active" ? "text-secondary font-bold" : state === "soon" ? "text-outline" : "text-primary"}`}>{right}</span>
                  </div>
                  <p className={`text-[13px] ${state === "soon" ? "text-outline" : "text-on-surface-variant"} mt-0.5`}>{s.d}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quote */}
        <div className="rounded-2xl bg-surface-container-low p-4 mb-5 flex flex-col items-center text-center">
          <Icon name="format_quote" size={24} fill className="text-secondary-container mb-1.5" />
          <p className="text-[15px] text-on-surface font-medium leading-relaxed italic max-w-xs">«أثمن ما نتركه لأبنائنا ليس الأشياء التي نملكها، بل الذكريات التي قضيناها معاً»</p>
          <span className="text-[12px] text-on-surface-variant mt-2">من حكمة الأجداد المتوارثة</span>
        </div>

        {/* Notify */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-container-lowest shadow-sm mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0"><Icon name="notifications_active" size={22} /></div>
          <div className="flex flex-col min-w-0"><p className="text-[17px] text-on-surface">استرح ودعنا نهتم بالباقي</p><p className="text-[13px] text-on-surface-variant">يمكنك إغلاق التطبيق وسنرسل لك تنبيهاً هادئاً فور اكتمال المشاهد.</p></div>
        </div>

        <div className="flex flex-col gap-2.5">
          {failed && <p className="text-[13px] text-error bg-error-container/50 rounded-lg px-3 py-2 text-center">تعذّر توليد المشاهد. حاول مرة أخرى.</p>}
          <button disabled={!done && !!jobId} onClick={goPlayer} className={`w-full h-[52px] rounded-full text-on-primary text-[14px] font-medium flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-60 ${done ? "bg-secondary" : "bg-primary-container"}`}>
            <Icon name={done ? "play_arrow" : "notifications_none"} size={20} fill={done} />
            <span>{done ? "شاهد الفيلم الآن" : "أشعرني عند جاهزية الحكاية"}</span>
          </button>
          <button onClick={() => router.push("/archive")} className="w-full h-11 rounded-full text-primary text-[14px] font-medium flex items-center justify-center gap-1 active:bg-surface-container-high"><span>العودة لرف الحكايات</span></button>
        </div>
      </main>
    </>
  );
}

export default function GeneratingPage() {
  return <Suspense fallback={<div className="min-h-screen" />}><GeneratingContent /></Suspense>;
}
