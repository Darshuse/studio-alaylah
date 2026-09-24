"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import RecordSheet from "@/components/RecordSheet";
import { api, getToken, getDisplayName, setSession, uploadAudioBlob } from "@/lib/api";

const PROMPTS = ["🎒 أول يوم في المدرسة", "🏕️ رحلة التخييم بالبر", "🥮 كعكة العيد مع الجدة", "🌧️ مطر الشتاء في الحي القديم"];
const BARS = [2, 4, 5, 3, 6, 4, 2, 3];

export default function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [heights, setHeights] = useState(BARS.map((h) => h * 4));
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState<string | null>(getDisplayName());
  const [plan, setPlan] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // اسم المستخدم الحقيقي + الاستحقاق من الخادم
  useEffect(() => {
    if (!getToken()) return;
    api.me().then((m) => {
      if (m.displayName) { setName(m.displayName); setSession(getToken()!, m.familyId || undefined, m.displayName); }
      if (m.plan) setPlan(m.plan);
      if (typeof m.storyCredits === "number") setCredits(m.storyCredits);
    }).catch(() => {});
  }, []);

  const titleFromPrompt = () => (selected != null ? PROMPTS[selected].replace(/^\S+\s/, "") : null);

  // كتابة: إنشاء حكاية والانتقال مباشرة للمراجعة
  const startWritten = async () => {
    if (!getToken()) { router.push("/login"); return; }
    setBusy(true);
    try {
      const story = await api.createStory({ title: titleFromPrompt(), sourceKind: "written" });
      router.push("/review?id=" + story.id);
    } catch { router.push("/login"); }
    finally { setBusy(false); }
  };

  // صوت: افتح لوحة التسجيل
  const startVoice = () => {
    if (!getToken()) { router.push("/login"); return; }
    setRecording(true);
  };

  // بعد انتهاء التسجيل: أنشئ الحكاية وارفع الصوت مباشرة للتخزين ثم انتقل للمراجعة
  const handleRecorded = async (blob: Blob) => {
    setUploading(true);
    try {
      const story = await api.createStory({ title: titleFromPrompt(), sourceKind: "voice" });
      await uploadAudioBlob(story.id, blob);
      router.push("/review?id=" + story.id);
    } catch {
      setUploading(false);
      setRecording(false);
      router.push("/login");
    }
  };

  const skipVoice = async () => {
    try {
      const story = await api.createStory({ title: titleFromPrompt(), sourceKind: "voice" });
      router.push("/review?id=" + story.id);
    } catch { router.push("/login"); }
  };

  const toggleWave = () => {
    setPlaying((p) => {
      const next = !p;
      if (next) timer.current = setInterval(() => setHeights(BARS.map(() => Math.floor(Math.random() * 20) + 6)), 150);
      else { if (timer.current) clearInterval(timer.current); setHeights(BARS.map((h) => h * 4)); }
      return next;
    });
  };

  return (
    <>
      <AppHeader tab="بدء حكاية" icon="auto_stories" />
      <main className="flex flex-col w-full px-margin pt-space-md pb-6 flex-grow gap-space-md">
        {/* Greeting */}
        <div className="flex flex-col gap-space-xs pt-space-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-low rounded-full w-fit shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
              <span className="text-[12px] text-on-surface-variant font-medium">دفتر الذكريات العائلي المفتوح</span>
            </div>
            {plan === "subscription" ? (
              <div className="inline-flex items-center gap-1 px-space-sm py-1 bg-primary-container text-on-primary rounded-full w-fit shadow-sm"><Icon name="workspace_premium" size={14} fill /><span className="text-[12px] font-semibold">اشتراك مفعّل</span></div>
            ) : credits !== null && (
              <div className="inline-flex items-center gap-1 px-space-sm py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full w-fit shadow-sm">
                <Icon name={credits > 0 ? "redeem" : "lock"} size={14} fill />
                <span className="text-[12px] font-semibold">{credits > 0 ? `${credits} قصة متاحة` : "اشحن للمتابعة"}</span>
              </div>
            )}
          </div>
          <h2 className="text-[22px] leading-[32px] font-semibold text-primary tracking-tight mt-1">{name ? `أهلاً يا ${name}، أي ذكرى نخلّدها اليوم؟` : "أهلاً بك، أي ذكرى نخلّدها اليوم؟"}</h2>
          <p className="text-[15px] leading-[24px] text-on-surface-variant">حكايتك بصوتك، وعائلتك أبطالها في كل مشهد. دع اللحظات تروى بصدق لتحفظها الأجيال.</p>
        </div>

        {/* Last memory */}
        <div className="relative w-full h-36 rounded-xl overflow-hidden shadow-sm bg-primary-container">
          <div className="absolute inset-0 bg-cover bg-center opacity-90" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCZ3kkSmD-yKEmGyPuxBOOSQiYKnbvIoXhvRoUBoiig4itQujz5tqXv24rgp9BW0GLic-cLJbc6woJBZgs-u7UUx9y4tG1MopylGFs80G4JTytn5aqgk_tSzMMjsXHVGHPly-pdfZ_6u06p1r_7rHlyUr10CPanXzEQACSim_MbLREV_LOoBXo7EivjerAknVg-e59t0L_3krXMHSnqjs6CVRN7DYntN0C0qQx-zA0kYhWwZhsI5cDe')" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent" />
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-on-primary">
            <div className="flex items-center gap-2">
              <Icon name="auto_awesome" size={20} fill className="text-tertiary-fixed-dim" />
              <span className="text-[12px] font-medium">آخر قصة: «يوم الصيد مع الجد بالمرسى»</span>
            </div>
            <span className="text-[12px] bg-surface/20 backdrop-blur-md px-2.5 py-0.5 rounded-full">منذ 3 أيام</span>
          </div>
        </div>

        {/* Voice card */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-[0_8px_24px_-4px_rgba(31,36,33,0.06)]">
          <div className="flex items-start gap-space-md">
            <div className="relative flex-shrink-0 w-14 h-14 rounded-full bg-primary-container flex items-center justify-center shadow-md">
              <div className="absolute inset-0 rounded-full bg-secondary-container/20 animate-ping opacity-60" />
              <Icon name="mic" size={28} fill className="text-secondary-container" />
            </div>
            <div className="flex flex-col flex-grow min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-semibold text-primary">تسجيل الحكاية بصوتك</h3>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary text-[12px]">موصى به</span>
              </div>
              <p className="text-[13px] text-on-surface-variant mt-1 leading-relaxed">تحدث بعفويتك، وسنحوّل نبراتك وحكايتك إلى مشاهد متناسقة وحوارات دافئة تحفظ روح العائلة.</p>
            </div>
          </div>
          <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button onClick={toggleWave} className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center shadow-sm active:scale-95">
                <Icon name={playing ? "pause" : "graphic_eq"} size={20} />
              </button>
              <span className="text-[12px] text-on-surface-variant">نقاء الصوت ممتاز</span>
            </div>
            <div className="flex items-center gap-1 h-6 max-w-[130px] justify-end">
              {heights.map((h, i) => <span key={i} className="w-1 bg-secondary-container rounded-full transition-all duration-300" style={{ height: h }} />)}
            </div>
          </div>
          <button onClick={startVoice} className="w-full mt-space-md h-[52px] rounded-full bg-primary-container text-on-primary text-[17px] font-semibold flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(27,59,54,0.18)] active:scale-[0.98]">
            <Icon name="mic" size={22} /><span>بدء التسجيل الآن</span>
          </button>
        </section>

        {/* Written card */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-[0_8px_24px_-4px_rgba(31,36,33,0.06)]">
          <div className="flex items-start gap-space-md">
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-primary shadow-inner">
              <Icon name="edit_note" size={26} />
            </div>
            <div className="flex flex-col flex-grow min-w-0">
              <h3 className="text-[17px] font-semibold text-primary">كتابة الذكرى باليد</h3>
              <p className="text-[13px] text-on-surface-variant mt-1 leading-relaxed">اكتب موقفاً طريفاً، أو حكمة عائلية، أو لحظة دافئة لا تود نسيانها، ودع الكلمات تنساب على الورق الرقمي.</p>
            </div>
          </div>
          <button disabled={busy} onClick={startWritten} className="w-full mt-space-md h-[50px] rounded-full bg-surface-container text-primary text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-surface-container-high active:scale-[0.98] disabled:opacity-60">
            <Icon name="history_edu" size={20} /><span>فتح صفحة فارغة للتدوين</span>
          </button>
        </section>

        {/* Prompts */}
        <section className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="lightbulb" size={20} className="text-secondary" />
              <h4 className="text-[17px] font-semibold text-primary">أفكار تلهمك اليوم</h4>
            </div>
            <span className="text-[12px] text-on-surface-variant">اختر موضوعاً</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {PROMPTS.map((p, i) => (
              <button key={i} onClick={() => setSelected(i)}
                className={`px-space-sm py-2 rounded-full text-[13px] shadow-sm active:scale-95 transition-all ${selected === i ? "bg-secondary-container text-on-secondary" : "bg-surface-container-lowest text-on-surface"}`}>
                {p}
              </button>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <footer className="bg-surface-container-high rounded-xl p-space-md flex items-center gap-space-sm">
          <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center flex-shrink-0 text-primary shadow-sm">
            <Icon name="shield" size={20} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-primary">
              <span className="text-[14px] font-semibold">حرمة عائلية مصونة</span><span className="text-[12px]">🔒</span>
            </div>
            <p className="text-[13px] text-on-surface-variant leading-normal">ذكرياتك مشفرة وخاصة بعائلتك وحدها، لا يطّلع عليها سواكم، ويمكنك حذف أو تصدير أي محتوى في أي لحظة.</p>
          </div>
        </footer>
      </main>
      {recording && (
        <RecordSheet
          busy={uploading}
          onClose={() => { if (!uploading) setRecording(false); }}
          onDone={handleRecorded}
          onSkip={skipVoice}
        />
      )}
      <BottomNav />
    </>
  );
}
