"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import BottomNav from "@/components/BottomNav";
import { ReadyStoryRow, ReadyStorySheet } from "@/components/ReadyStoryPicker";
import { api, getToken, getDisplayName, setSession, type Story } from "@/lib/api";
import type { ReadyStory } from "@/lib/readyStories";

/** تاريخ نسبي بالعربي: اليوم / أمس / منذ N أيام / أسابيع / أشهر. */
function relativeDay(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
  return `منذ ${Math.floor(days / 30)} أشهر`;
}

const STEPS = [
  { n: "١", label: "النص" },
  { n: "٢", label: "صوتك" },
  { n: "٣", label: "الفيلم والكتاب" },
];

export default function HomePage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<ReadyStory | null>(null);
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

  // اكتب حكايتك: حكاية فارغة → شاشة النص
  const startWritten = async () => {
    if (!getToken()) { router.push("/login"); return; }
    setBusy(true);
    try {
      const story = await api.createStory({ title: null, sourceKind: "written" });
      router.push("/review?id=" + story.id);
    } catch { router.push("/login"); }
    finally { setBusy(false); }
  };

  // حكاية جاهزة: أنشئ الحكاية بنصها الجاهز → شاشة النص (قابل للتعديل) → صوتك
  const useReady = async (title: string, text: string) => {
    if (!getToken()) { router.push("/login"); return; }
    setBusy(true);
    try {
      const story = await api.createStory({ title, sourceKind: "written" });
      await api.saveText(story.id, text);
      router.push("/review?id=" + story.id);
    } catch { setBusy(false); router.push("/login"); }
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
      {/* ===== المسرح الداكن ===== */}
      <div className="flex flex-col flex-grow text-white bg-[radial-gradient(120%_70%_at_50%_30%,#1F4A43_0%,#123832_45%,#0A1F1B_100%)]">
        <header className="pt-safe px-margin">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon.png" alt="حكايات العائلة" className="w-10 h-10 rounded-xl object-cover shadow-md" />
              <span className="text-[16px] font-bold">حكايات العائلة</span>
            </div>
            {creditLabel && (
              <a href="/pay" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[rgba(217,130,59,0.2)] border border-[rgba(217,130,59,0.4)] text-[#F5C989] text-[12px] font-semibold">
                <Icon name={creditLabel.icon} size={16} fill />{creditLabel.text}
              </a>
            )}
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center text-center px-margin pt-space-md pb-10">
          <p className="text-[14px] text-[#A9C4BC]">{name ? `أهلاً يا ${name}` : "أهلاً بك"}</p>
          <h1 className="text-[26px] leading-[38px] font-extrabold mt-1 text-balance">اكتب حكايتك… وبصوتك نصنع فيلمها</h1>

          {/* الفعل الرئيسي: النص أولًا */}
          <div className="relative w-[150px] h-[150px] mt-9">
            <span aria-hidden className="absolute -inset-10 rounded-full border border-[rgba(217,130,59,0.18)] motion-safe:animate-pulse" />
            <span aria-hidden className="absolute -inset-5 rounded-full border-[1.5px] border-[rgba(217,130,59,0.35)]" />
            <button
              onClick={startWritten}
              disabled={busy}
              aria-label="اكتب حكايتك"
              className="relative w-full h-full rounded-full flex items-center justify-center text-white bg-gradient-to-b from-[#EE9A52] via-[#D9823B] to-[#C96A24] shadow-[0_18px_50px_-8px_rgba(217,130,59,0.75),inset_0_2px_0_rgba(255,255,255,0.35)] active:scale-95 transition-transform disabled:opacity-70"
            >
              <Icon name={busy ? "progress_activity" : "edit_note"} size={68} fill className={busy ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="mt-14">
            <p className="text-[18px] font-bold">اضغط واكتب حكايتك</p>
            <p className="text-[13px] text-[#A9C4BC] mt-1">أو اختار حكاية جاهزة من تحت — وبعدها تقرأها بصوتك</p>
          </div>

          {/* مسار من ٣ خطوات */}
          <ol className="mt-6 flex items-center gap-2 text-[12px] text-[#CFE0DA]">
            {STEPS.map((s, i) => (
              <li key={s.n} className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)]">
                  <b className="text-[#F5C989]">{s.n}</b>{s.label}
                </span>
                {i < STEPS.length - 1 && <Icon name="chevron_left" size={16} className="text-[#7FA79C]" />}
              </li>
            ))}
          </ol>
        </main>
      </div>

      {/* ===== الورقة الفاتحة: حكايات جاهزة + آخر حكاية ===== */}
      <section className="relative -mt-6 bg-surface rounded-t-[28px] px-margin pt-3 pb-6 flex flex-col gap-space-md">
        <div className="w-10 h-1 rounded-full bg-outline-variant mx-auto" aria-hidden />

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-bold text-primary">حكايات جاهزة</span>
            <span className="text-[12px] text-secondary font-semibold">اضغط واستخدمها</span>
          </div>
          <ReadyStoryRow onOpen={setPicked} />
        </div>

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

        <p className="flex items-center justify-center gap-1.5 text-[12px] text-on-surface-variant">
          <Icon name="lock" size={14} />ذكرياتك وصوتك لعائلتك وحدها، وتقدر تمسحهم في أي وقت.
        </p>
      </section>

      {picked && (
        <ReadyStorySheet
          story={picked}
          busy={busy}
          onClose={() => { if (!busy) setPicked(null); }}
          onUse={useReady}
        />
      )}
      <BottomNav />
    </>
  );
}
