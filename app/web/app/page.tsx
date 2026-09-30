"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import BottomNav from "@/components/BottomNav";
import { ReadyStoryRow, ReadyStorySheet } from "@/components/ReadyStoryPicker";
import { api, getToken, getDisplayName, setSession, type Story } from "@/lib/api";
import type { ReadyStory } from "@/lib/readyStories";

/** تاريخ نسبي بالعربي. */
function relativeDay(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
  return `منذ ${Math.floor(days / 30)} أشهر`;
}

const STEPS = [
  { n: "١", icon: "edit_note", t: "اكتب الحكاية", d: "اكتب القصة التي تريدها بكل تفاصيلها" },
  { n: "٢", icon: "mic", t: "أضف صوتك", d: "اقرأ النص مرة واحدة فنستنسخ صوتك" },
  { n: "٣", icon: "movie", t: "شاهد الفيلم", d: "نحوّل قصتك إلى فيلم وكتاب مصوّر" },
];

const FEATURES = [
  { icon: "diversity_1", t: "لكل الأعمار", d: "عائلية وتعليمية" },
  { icon: "star", t: "جودة عالية", d: "أسلوب سينمائي" },
  { icon: "verified_user", t: "آمن وموثوق", d: "خصوصيتك أمانة" },
  { icon: "bolt", t: "سهل وسريع", d: "خطوات معدودة" },
  { icon: "favorite", t: "يجمع العائلة", d: "أنت وطفلك الأبطال" },
];

// بطاقات المعرض — صور حقيقية من إنتاجنا (نفس جودة ما تصنعه)
const SHOWCASE = [
  { img: "/scenes/waterfall.png", cat: "مغامرة", color: "bg-secondary-container text-on-secondary-container", title: "الغابة والشلال" },
  { img: "/scenes/bird-nest.png", cat: "قيم وسلوك", color: "bg-primary-container text-on-primary", title: "العصفور الصغير" },
  { img: "/scenes/village.jpg", cat: "ذكريات عائلية", color: "bg-tertiary-fixed text-tertiary", title: "حارتنا القديمة" },
  { img: "/scenes/bird-hold.jpg", cat: "تعليمية", color: "bg-secondary-fixed text-on-secondary-fixed", title: "الرفق بالحيوان" },
];

export default function HomePage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<ReadyStory | null>(null);
  const [authed, setAuthed] = useState(false);
  const [name, setName] = useState<string | null>(getDisplayName());
  const [plan, setPlan] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [lastStory, setLastStory] = useState<Story | null | undefined>(undefined);

  useEffect(() => {
    if (!getToken()) { setLastStory(null); setAuthed(false); return; }
    setAuthed(true);
    api.me().then((m) => {
      if (m.displayName) { setName(m.displayName); setSession(getToken()!, m.familyId || undefined, m.displayName); }
      if (m.plan) setPlan(m.plan);
      if (typeof m.storyCredits === "number") setCredits(m.storyCredits);
    }).catch(() => {});
    api.listStories().then((list) => setLastStory(list[0] ?? null)).catch(() => setLastStory(null));
  }, []);

  const startWritten = async () => {
    if (!getToken()) { router.push("/login?mode=register"); return; }
    setBusy(true);
    try {
      const story = await api.createStory({ title: null, sourceKind: "written" });
      router.push("/review?id=" + story.id);
    } catch { router.push("/login"); }
    finally { setBusy(false); }
  };

  const useReady = async (title: string, text: string) => {
    if (!getToken()) { router.push("/login?mode=register"); return; }
    setBusy(true);
    try {
      const story = await api.createStory({ title, sourceKind: "written" });
      await api.saveText(story.id, text);
      router.push("/review?id=" + story.id);
    } catch { setBusy(false); router.push("/login"); }
  };

  const creditLabel =
    plan === "subscription" ? { icon: "workspace_premium", text: "اشتراك مفعّل" }
    : credits === null ? null
    : credits <= 0 ? { icon: "lock", text: "اشحن للمتابعة" }
    : credits === 1 && !lastStory ? { icon: "redeem", text: "أول حكاية هدية" }
    : { icon: "redeem", text: `${credits} قصة متاحة` };

  return (
    <>
      {/* ===== الترويسة ===== */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/40 pt-safe">
        <div className="h-16 px-margin flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="حكايات العائلة" className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0" />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[15px] font-extrabold text-primary truncate">حكايات العائلة</span>
              <span className="text-[10px] text-on-surface-variant truncate">لحظات من الماضي… لذكريات المستقبل</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {authed
              ? creditLabel && (
                  <a href="/pay" className="inline-flex items-center gap-1 h-9 px-2.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11.5px] font-semibold">
                    <Icon name={creditLabel.icon} size={15} fill />{creditLabel.text}
                  </a>
                )
              : <a href="/login" className="inline-flex items-center h-9 px-2.5 text-[12.5px] font-semibold text-primary">دخول</a>}
            <button onClick={startWritten} className="inline-flex items-center gap-1 h-9 px-3.5 rounded-full bg-primary text-white text-[12.5px] font-bold shadow-sm active:scale-95 transition-transform">
              <Icon name="arrow_back" size={15} />ابدأ الآن
            </button>
          </div>
        </div>
      </header>

      {/* ===== الهيرو ===== */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_90%_at_70%_15%,#1F4A43_0%,#123832_50%,#0A1F1B_100%)] text-white">
        <div className="px-margin pt-space-md pb-16 flex flex-col gap-5">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-[rgba(245,201,137,0.35)] aspect-[16/10]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/scenes/waterfall.png" alt="مشهد من فيلم أنتجناه" className="w-full h-full object-cover" />
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-black/45 backdrop-blur text-[11px] font-semibold text-white">
              <Icon name="movie" size={14} fill />من إنتاجنا الحقيقي
            </span>
          </div>

          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[rgba(217,130,59,0.18)] border border-[rgba(217,130,59,0.35)] text-[#F5C989] text-[12px] font-semibold mb-3">
              <Icon name="auto_awesome" size={15} fill />بالذكاء الاصطناعي
            </span>
            <h1 className="text-[30px] leading-[44px] font-extrabold text-balance">
              اكتب حكايتك<br />وبصوتك نصنع <span className="text-[#F5C989]">فيلمها</span>
            </h1>
            <p className="text-[15px] text-[#B9D2CB] leading-relaxed mt-3">
              حوّل قصصك العائلية إلى أفلام قصيرة وكتب مصوّرة، بطلها طفلك وراويها أنت — واحتفظ بذكريات لا تُنسى.
            </p>
          </div>
        </div>

        {/* بطاقة الخطوات العائمة */}
        <div className="relative px-margin -mb-14" id="how">
          <div className="bg-surface rounded-3xl shadow-[0_20px_50px_-15px_rgba(3,37,33,0.4)] p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {STEPS.map((s) => (
                <div key={s.n} className="flex items-center gap-3 text-right">
                  <span className="relative shrink-0">
                    <span className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center"><Icon name={s.icon} size={22} fill /></span>
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-secondary text-white text-[11px] font-bold flex items-center justify-center">{s.n}</span>
                  </span>
                  <div className="min-w-0 flex-grow">
                    <div className="text-[15px] font-bold text-primary">{s.t}</div>
                    <div className="text-[12px] text-on-surface-variant leading-snug">{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={startWritten} disabled={busy}
              className="h-14 rounded-full bg-gradient-to-b from-[#EE9A52] to-[#C96A24] text-white text-[16px] font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform disabled:opacity-70">
              <Icon name={busy ? "progress_activity" : "arrow_back"} size={20} className={busy ? "animate-spin" : ""} />
              {busy ? "لحظة…" : "ابدأ الآن — أول حكاية هدية 🎁"}
            </button>
          </div>
        </div>
      </section>

      {/* ===== المزايا ===== */}
      <section className="bg-surface pt-20 pb-space-lg">
        <div className="px-margin grid grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.t} className="flex flex-col items-center text-center gap-1.5">
              <span className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-secondary shadow-sm"><Icon name={f.icon} size={26} fill /></span>
              <div className="text-[14px] font-bold text-primary">{f.t}</div>
              <div className="text-[12px] text-on-surface-variant -mt-1">{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== معرض القصص ===== */}
      <section id="showcase" className="bg-surface-container-low py-space-lg">
        <div className="px-margin">
          <div className="text-center mb-5">
            <h2 className="text-[24px] font-extrabold text-primary">قصص من قلب العائلة</h2>
            <p className="text-[13px] text-on-surface-variant mt-1">نماذج حقيقية من جودة الرسوم التي نصنعها لحكاياتك</p>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {SHOWCASE.map((c) => (
              <button key={c.title} onClick={startWritten}
                className="group text-right rounded-2xl overflow-hidden bg-surface shadow-sm active:scale-[0.99] transition-transform">
                <div className="relative aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.img} alt={c.title} className="w-full h-full object-cover" />
                  <span className={"absolute top-2 right-2 h-6 px-2.5 rounded-full text-[11px] font-bold flex items-center " + c.color}>{c.cat}</span>
                </div>
                <div className="p-2.5">
                  <div className="text-[13.5px] font-bold text-primary truncate">{c.title}</div>
                  <div className="text-[11.5px] text-secondary font-semibold mt-0.5 flex items-center gap-1"><Icon name="add" size={14} />اصنع مثلها</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== حكايات جاهزة + آخر حكاية (وظائف التطبيق) ===== */}
      <section className="bg-surface py-space-lg">
        <div className="px-margin flex flex-col gap-space-md">
          {name && <p className="text-[14px] text-on-surface-variant">أهلاً يا {name} 👋</p>}

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[16px] font-extrabold text-primary">حكايات جاهزة بضغطة</span>
              <span className="text-[12px] text-secondary font-semibold">اضغط واستخدمها</span>
            </div>
            <ReadyStoryRow onOpen={setPicked} />
          </div>

          {lastStory && (
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-secondary">آخر حكاية</span>
              <button onClick={() => router.push((lastStory.hasFilm ? "/player?id=" : "/review?id=") + lastStory.id)}
                className="flex items-center gap-3 text-right bg-surface-container-low rounded-2xl p-3 active:scale-[0.99] transition-transform">
                <div className="relative w-[56px] h-[56px] rounded-xl overflow-hidden bg-primary-container shrink-0 flex items-center justify-center">
                  {lastStory.coverUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={lastStory.coverUrl} alt="" className="w-full h-full object-cover" />
                    : <Icon name="edit_note" size={24} className="text-secondary-container" />}
                </div>
                <div className="flex flex-col min-w-0 flex-grow">
                  <span className="text-[14px] font-bold text-primary truncate">{lastStory.displayTitle || lastStory.title || "حكاية بدون عنوان"}</span>
                  <span className="text-[12px] text-on-surface-variant">
                    {lastStory.hasFilm ? "جاهزة للمشاهدة" : lastStory.status === "rendering" ? "قيد الإنتاج…" : "مسودة"}
                    {lastStory.createdAt ? ` • ${relativeDay(lastStory.createdAt)}` : ""}
                  </span>
                </div>
                <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0"><Icon name={lastStory.hasFilm ? "play_arrow" : "arrow_back"} size={20} /></span>
              </button>
            </div>
          )}

          <p className="flex items-center gap-1.5 text-[12px] text-on-surface-variant">
            <Icon name="lock" size={14} />ذكرياتك وصوتك لعائلتك وحدها، وتقدر تمسحهم في أي وقت.
          </p>
        </div>
      </section>

      {/* ===== خاتمة CTA ===== */}
      <section className="bg-primary text-white py-space-lg">
        <div className="px-margin text-center flex flex-col items-center gap-4">
          <h2 className="text-[24px] font-extrabold text-balance">ابدأ بأول حكاية… <span className="text-[#F5C989]">هدية</span></h2>
          <p className="text-[14px] text-[#B9D2CB]">اكتب قصتك الأولى الآن، واسمع صوتك يحكيها لطفلك.</p>
          <button onClick={startWritten} disabled={busy}
            className="h-14 px-8 rounded-full bg-gradient-to-b from-[#EE9A52] to-[#C96A24] text-white text-[16px] font-bold flex items-center gap-2 shadow-lg active:scale-[0.98] transition-transform disabled:opacity-70">
            <Icon name={busy ? "progress_activity" : "auto_stories"} size={20} fill className={busy ? "animate-spin" : ""} />اصنع حكايتك
          </button>
          <div className="flex items-center gap-4 text-[12px] text-[#8FB0A8] mt-1">
            <a href="/about" className="hover:text-white">من نحن</a>
            <a href="/pay" className="hover:text-white">الأسعار</a>
            <a href="/privacy-policy" className="hover:text-white">الخصوصية</a>
          </div>
        </div>
      </section>

      {picked && (
        <ReadyStorySheet story={picked} busy={busy}
          onClose={() => { if (!busy) setPicked(null); }} onUse={useReady} />
      )}
      <BottomNav />
    </>
  );
}
