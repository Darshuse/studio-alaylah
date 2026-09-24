"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import BottomNav from "@/components/BottomNav";
import RecordSheet from "@/components/RecordSheet";
import { api, getToken, getDisplayName, setSession, uploadAudioBlob, type Story } from "@/lib/api";

const PROMPTS = [
  { icon: "school", text: "أول يوم في المدرسة" },
  { icon: "camping", text: "رحلة التخييم بالبر" },
  { icon: "cake", text: "كعكة العيد مع الجدة" },
  { icon: "rainy", text: "مطر الشتاء في الحي القديم" },
];

/** تاريخ نسبي بالعربي: اليوم / أمس / منذ N أيام / أسابيع / أشهر. */
function relativeDay(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
  return `منذ ${Math.floor(days / 30)} أشهر`;
}

export default function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState<string | null>(getDisplayName());
  const [plan, setPlan] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  // undefined = جارٍ التحميل · null = لا حكايات بعد · Story = آخر حكاية حقيقية
  const [lastStory, setLastStory] = useState<Story | null | undefined>(undefined);

  // اسم المستخدم + الاستحقاق + آخر حكاية — كلها من الخادم (لا محتوى وهمي)
  useEffect(() => {
    if (!getToken()) { setLastStory(null); return; }
    api.me().then((m) => {
      if (m.displayName) { setName(m.displayName); setSession(getToken()!, m.familyId || undefined, m.displayName); }
      if (m.plan) setPlan(m.plan);
      if (typeof m.storyCredits === "number") setCredits(m.storyCredits);
    }).catch(() => {});
    api.listStories().then((list) => setLastStory(list[0] ?? null)).catch(() => setLastStory(null));
  }, []);

  const titleFromPrompt = () => (selected != null ? PROMPTS[selected].text : null);

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

  // شارة الاستحقاق
  const creditLabel =
    plan === "subscription" ? { icon: "workspace_premium", text: "اشتراك مفعّل" }
    : credits === null ? null
    : credits <= 0 ? { icon: "lock", text: "اشحن للمتابعة" }
    : credits === 1 && !lastStory ? { icon: "redeem", text: "أول حكاية هدية" }
    : { icon: "redeem", text: `${credits} قصة متاحة` };

  return (
    <>
      {/* ===== المسرح الداكن: صوتك أولًا ===== */}
      <div className="flex flex-col flex-grow text-white bg-[radial-gradient(120%_70%_at_50%_30%,#1F4A43_0%,#123832_45%,#0A1F1B_100%)]">
        <header className="pt-safe px-margin">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon.png" alt="حكايات العائلة" className="w-10 h-10 rounded-xl object-cover shadow-md" />
              <span className="text-[16px] font-bold">حكايات العائلة</span>
            </div>
            {creditLabel && (
              <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[rgba(217,130,59,0.2)] border border-[rgba(217,130,59,0.4)] text-[#F5C989] text-[12px] font-semibold">
                <Icon name={creditLabel.icon} size={16} fill />{creditLabel.text}
              </span>
            )}
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center text-center px-margin pt-space-md pb-10">
          <p className="text-[14px] text-[#A9C4BC]">{name ? `أهلاً يا ${name}` : "أهلاً بك"}</p>
          <h1 className="text-[26px] leading-[38px] font-extrabold mt-1 text-balance">احكِ لطفلك… ونحن نحوّلها لفيلم</h1>

          {/* زر المايك — الفعل الرئيسي الوحيد */}
          <div className="relative w-[150px] h-[150px] mt-10">
            <span aria-hidden className="absolute -inset-10 rounded-full border border-[rgba(217,130,59,0.18)] motion-safe:animate-pulse" />
            <span aria-hidden className="absolute -inset-5 rounded-full border-[1.5px] border-[rgba(217,130,59,0.35)]" />
            <button
              onClick={startVoice}
              aria-label="ابدأ تسجيل الحكاية بصوتك"
              className="relative w-full h-full rounded-full flex items-center justify-center text-white bg-gradient-to-b from-[#EE9A52] via-[#D9823B] to-[#C96A24] shadow-[0_18px_50px_-8px_rgba(217,130,59,0.75),inset_0_2px_0_rgba(255,255,255,0.35)] active:scale-95 transition-transform"
            >
              <Icon name="mic" size={68} fill />
            </button>
          </div>

          <div className="mt-14">
            <p className="text-[18px] font-bold">اضغط واحكِ حكايتك</p>
            <p className="text-[13px] text-[#A9C4BC] mt-1">بصوتك… عشان طفلك يسمع بابا</p>
          </div>

          <button
            onClick={startWritten}
            disabled={busy}
            className="mt-5 min-h-[44px] px-5 rounded-full border border-[rgba(245,201,137,0.35)] text-[#F5C989] text-[14px] font-semibold inline-flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
          >
            <Icon name={busy ? "progress_activity" : "edit"} size={19} className={busy ? "animate-spin" : ""} />
            <span>أو اكتب الحكاية بدل الصوت</span>
          </button>
        </main>
      </div>

      {/* ===== الورقة الفاتحة: آخر حكاية + أفكار ===== */}
      <section className="relative -mt-6 bg-surface rounded-t-[28px] px-margin pt-3 pb-6 flex flex-col gap-space-md">
        <div className="w-10 h-1 rounded-full bg-outline-variant mx-auto" aria-hidden />

        {lastStory === undefined ? (
          <div className="h-[86px] rounded-2xl bg-surface-container animate-pulse" aria-hidden />
        ) : lastStory ? (
          <div className="flex flex-col gap-2">
            <span className="text-[11.5px] font-bold text-secondary">آخر حكاية</span>
            <button
              onClick={() => router.push((lastStory.hasFilm ? "/player?id=" : "/review?id=") + lastStory.id)}
              className="flex items-center gap-3 text-right active:scale-[0.99] transition-transform"
            >
              <div className="relative w-[62px] h-[62px] rounded-2xl overflow-hidden bg-primary-container shrink-0 flex items-center justify-center">
                {lastStory.coverUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={lastStory.coverUrl} alt="" className="w-full h-full object-cover" />
                  : <Icon name="edit_note" size={26} className="text-secondary-container" />}
              </div>
              <div className="flex flex-col min-w-0 flex-grow">
                <span className="text-[14.5px] font-bold text-primary truncate">{lastStory.displayTitle || lastStory.title || "حكاية بدون عنوان"}</span>
                <span className="text-[12px] text-on-surface-variant">
                  {lastStory.hasFilm ? "جاهزة للمشاهدة" : lastStory.status === "rendering" ? "قيد الإنتاج…" : "مسودة"}
                  {lastStory.createdAt ? ` • ${relativeDay(lastStory.createdAt)}` : ""}
                </span>
              </div>
              <span className="w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                <Icon name={lastStory.hasFilm ? "play_arrow" : "arrow_back"} size={22} />
              </span>
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-[11.5px] font-bold text-secondary">أفكار للبدء</span>
          <div className="flex gap-2 overflow-x-auto -mx-margin px-margin pb-1">
            {PROMPTS.map((p, i) => (
              <button
                key={p.text}
                onClick={() => setSelected(selected === i ? null : i)}
                aria-pressed={selected === i}
                className={`shrink-0 h-11 px-4 rounded-2xl border text-[13px] font-semibold inline-flex items-center gap-2 transition-colors ${
                  selected === i
                    ? "bg-secondary-container text-on-secondary border-transparent"
                    : "bg-surface-container-lowest text-on-surface border-outline-variant"
                }`}
              >
                <Icon name={p.icon} size={19} className={selected === i ? "" : "text-secondary"} />
                {p.text}
              </button>
            ))}
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[12px] text-on-surface-variant">
          <Icon name="lock" size={14} />ذكرياتك لعائلتك وحدها، وتقدر تمسحها في أي وقت.
        </p>
      </section>

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
