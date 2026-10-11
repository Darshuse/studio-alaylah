"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import BottomNav from "@/components/BottomNav";
import { ReadyStorySheet } from "@/components/ReadyStoryPicker";
import { api, getToken, getDisplayName, setSession, type Story } from "@/lib/api";
import { READY_STORIES, type ReadyStory } from "@/lib/readyStories";

function relativeDay(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
  return `منذ ${Math.floor(days / 30)} أشهر`;
}

const STEPS = [
  { n: "١", icon: "edit_note", t: "اكتب الحكاية", d: "اكتب القصة التي تريدها بكل تفاصيلها وذكرياتها", ic: "bg-primary/10 text-primary", tc: "text-primary" },
  { n: "٢", icon: "mic", t: "أضف صوتك", d: "اقرأ النص لمرة واحدة فنستنسخ نبرتك الحنونة بأمان", ic: "bg-secondary-container/30 text-secondary", tc: "text-secondary" },
  { n: "٣", icon: "movie", t: "شاهد الفيلم", d: "نحوّل قصتك إلى فيلم متحرك وكتاب مصوّر بجودة مبهرة", ic: "bg-primary-container text-on-primary shadow-sm", tc: "text-primary-container" },
];

const FEATURES = [
  { icon: "favorite", t: "يجمع العائلة", d: "أنت وطفلك الأبطال", c: "text-secondary" },
  { icon: "star", t: "جودة عالية", d: "أسلوب سينمائي", c: "text-primary-container" },
  { icon: "verified_user", t: "آمن وموثوق", d: "خصوصيتك أمانة", c: "text-primary" },
  { icon: "bolt", t: "سهل وسريع", d: "خطوات معدودة", c: "text-secondary" },
  { icon: "diversity_1", t: "لكل الأعمار", d: "عائلية وتربوية", c: "text-primary-container" },
];

const SHOWCASE = [
  { img: "/scenes/waterfall.png", cat: "مغامرة", catC: "text-primary", tag: "كتاب + فيديو", tagIcon: "auto_stories",
    title: "الغابة والشلال", kind: "استكشاف وشجاعة", kindC: "text-secondary-container bg-secondary-container/10",
    d: "مغامرة استكشافية يتعلم فيها الصغير كيف يواجه المجهول بشجاعة وحكمة بصحبة رفيقه الذكي." },
  { img: "/scenes/bird-hold.jpg", cat: "قيم وسلوك", catC: "text-tertiary-container", tag: "بصوت الوالدين", tagIcon: "volume_up",
    title: "العصفور الصغير", kind: "تربوي هادف", kindC: "text-primary",
    d: "قصة رقيقة عن العطف ومساعدة الضعيف، تعزز روح الرحمة والمسؤولية في قلب طفلك." },
  { img: "/scenes/village.jpg", cat: "ذكريات عائلية", catC: "text-secondary", tag: "تراث الأجداد", tagIcon: "history_edu",
    title: "حارتنا القديمة", kind: "نوستالجيا", kindC: "text-secondary",
    d: "توثيق حكايات الأجداد وألعاب أيام زمان في الحارة الشعبية لتعريف الجيل الجديد بجذوره." },
  { img: "/scenes/bird-nest.png", cat: "تعليمية", catC: "text-primary-container", tag: "بناء الشخصية", tagIcon: "school",
    title: "الرفق بالحيوان", kind: "مغزى نبيل", kindC: "text-primary",
    d: "تعليم الصغار آداب التعامل مع الكائنات الحية وحمايتها من خلال مواقف يومية مؤثرة." },
];

const READY_TINT = [
  "bg-primary/10 text-primary",
  "bg-secondary-container/20 text-secondary",
  "bg-tertiary-container/15 text-tertiary",
  "bg-primary-fixed text-on-primary-fixed-variant",
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

  // وضع الموقع: خروج من إطار الهاتف ليصبح ريسبونسيف كامل العرض على الشاشات الكبيرة
  useEffect(() => {
    document.documentElement.classList.add("site");
    return () => document.documentElement.classList.remove("site");
  }, []);

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
      <header className="sticky top-0 z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
        <div className="max-w-6xl mx-auto h-16 px-gutter flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="حكايات العائلة" className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0" />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[14px] font-extrabold text-primary tracking-tight truncate">حكايات العائلة</span>
              <span className="text-[10px] text-secondary truncate">لحظات من الماضي</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-[14px] font-semibold text-on-surface-variant">
            <a href="#how" className="hover:text-primary transition-colors">كيف تعمل؟</a>
            <a href="#showcase" className="hover:text-primary transition-colors">القصص</a>
            <a href="/pay" className="hover:text-primary transition-colors">الأسعار</a>
            <a href="/about" className="hover:text-primary transition-colors">من نحن</a>
          </nav>
          <div className="flex items-center gap-1.5 shrink-0">
            {authed
              ? creditLabel && (
                  <a href="/pay" className="h-9 px-2.5 rounded-full bg-secondary-container/25 text-on-secondary-container text-[11.5px] font-bold flex items-center gap-1">
                    <Icon name={creditLabel.icon} size={15} fill />{creditLabel.text}
                  </a>
                )
              : <a href="/login" className="h-9 px-2.5 rounded-full flex items-center text-[12.5px] font-semibold text-primary hover:bg-surface-container-high">دخول</a>}
            <button onClick={startWritten} className="h-9 px-3.5 rounded-full bg-primary-container hover:bg-primary text-on-primary text-[12.5px] font-bold flex items-center gap-1 shadow-sm transition-all">
              <Icon name="auto_awesome" size={15} fill />ابدأ الآن
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col w-full pb-24 lg:pb-0">
        {/* ===== 1. الهيرو ===== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-surface-container via-surface to-surface-container-low px-gutter pt-8 pb-10 lg:pt-14 lg:pb-16 scroll-mt-20">
          <div className="absolute -top-16 -right-16 w-64 h-64 lg:w-96 lg:h-96 rounded-full bg-secondary-container/15 blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 -left-12 w-48 h-48 lg:w-80 lg:h-80 rounded-full bg-primary-container/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 lg:gap-12 lg:items-center">
              {/* النص */}
              <div className="flex flex-col items-center text-center lg:items-start lg:text-right order-1">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-lowest shadow-[0_2px_12px_rgba(14,84,98,0.08)] mb-4">
                  <Icon name="movie" size={16} className="text-secondary" fill />
                  <span className="text-[11px] font-semibold text-on-surface-variant">فيلم وكتاب مصوّر بصوتك · من إنتاجنا الحقيقي</span>
                </div>
                <h1 className="text-[34px] leading-[46px] lg:text-[48px] lg:leading-[62px] font-extrabold text-primary tracking-tight mb-2.5">
                  اكتب حكايتك…<br /><span className="text-secondary">وبصوتك نصنع فيلمها</span>
                </h1>
                <p className="text-[15px] lg:text-[17px] text-on-surface-variant leading-relaxed max-w-xs lg:max-w-md mb-6">
                  حوّل قصصك العائلية إلى أفلام قصيرة وكتب مصوّرة، بطلها طفلك وراويها أنت — واحتفظ بذكريات لا تُنسى.
                </p>
                {/* CTA يظهر هنا على الديسكتوب */}
                <button onClick={startWritten} disabled={busy}
                  className="hidden lg:inline-flex py-4 px-8 rounded-full bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary text-[16px] font-bold items-center justify-center gap-2 shadow-[0_8px_20px_-2px_rgba(254,173,75,0.4)] active:scale-[0.98] transition-all disabled:opacity-70">
                  <span>ابدأ الآن — أول حكاية هدية 🎁</span><Icon name="arrow_back" size={20} />
                </button>
              </div>
              {/* الصورة */}
              <div className="order-2 mt-6 lg:mt-0">
                <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_12px_36px_-6px_rgba(14,84,98,0.18)] bg-surface-container-highest aspect-[16/10]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/scenes/waterfall.png" alt="مشهد من فيلم أنتجناه" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-4">
                    <div className="flex items-center gap-2 text-on-primary">
                      <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-md"><Icon name="play_arrow" size={18} fill /></span>
                      <div className="text-right">
                        <span className="block text-[12px] font-bold leading-none mb-0.5">مشهد من فيلم أنتجناه</span>
                        <span className="block text-[11px] text-primary-fixed leading-none">بصوت الأب · رسم سينمائي</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* بطاقة الخطوات */}
            <div id="how" className="scroll-mt-20 max-w-4xl mx-auto w-full bg-surface-container-lowest rounded-2xl p-4 lg:p-6 shadow-[0_6px_24px_-4px_rgba(14,84,98,0.08)] mt-8 flex flex-col sm:flex-row sm:gap-0 gap-3 sm:divide-x sm:divide-x-reverse sm:divide-surface-container-highest">
              {STEPS.map((s) => (
                <div key={s.n} className="flex items-center gap-3 text-right sm:flex-1 sm:px-5 first:sm:pr-0 last:sm:pl-0">
                  <div className={"w-9 h-9 rounded-full flex items-center justify-center shrink-0 " + s.ic}><Icon name={s.icon} size={18} fill /></div>
                  <div className="flex-1 min-w-0">
                    <span className={"text-[13px] font-bold " + s.tc}>{s.n}. {s.t}</span>
                    <p className="text-[12px] text-on-surface-variant sm:line-clamp-2">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA للموبايل */}
            <div className="lg:hidden max-w-md mx-auto mt-6 flex flex-col items-center">
              <button onClick={startWritten} disabled={busy}
                className="w-full py-4 px-6 rounded-full bg-secondary-container hover:bg-secondary text-on-secondary-container text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_8px_20px_-2px_rgba(254,173,75,0.4)] active:scale-[0.98] transition-all disabled:opacity-70">
                <span>{busy ? "لحظة…" : "ابدأ الآن — أول حكاية هدية 🎁"}</span>
                <Icon name={busy ? "progress_activity" : "arrow_back"} size={20} className={busy ? "animate-spin" : ""} />
              </button>
              <span className="text-[11px] text-on-surface-variant mt-2">بضع دقائق فقط لصناعة فيلم عائلي يبقى للأبد</span>
            </div>
          </div>
        </section>

        {/* ===== 2. شريط المزايا ===== */}
        <section className="w-full py-4 bg-surface-container-low">
          <div className="max-w-6xl mx-auto px-gutter flex items-center gap-3 overflow-x-auto lg:overflow-visible lg:flex-wrap lg:justify-center">
            {FEATURES.map((f) => (
              <div key={f.t} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-lowest shadow-sm shrink-0">
                <Icon name={f.icon} size={20} className={f.c} fill />
                <div className="flex flex-col text-right">
                  <span className="text-[13px] font-bold text-on-surface leading-tight">{f.t}</span>
                  <span className="text-[10px] text-on-surface-variant">{f.d}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 3. معرض القصص ===== */}
        <section id="showcase" className="w-full px-gutter py-10 lg:py-14 bg-surface scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center mb-6 lg:mb-10">
              <div className="inline-flex items-center gap-1 text-tertiary mb-1"><Icon name="favorite" size={16} fill /><span className="text-[11px] font-bold">من وحي الذاكرة</span></div>
              <h2 className="text-[26px] lg:text-[34px] font-extrabold text-primary">قصص من قلب العائلة</h2>
              <p className="text-[12px] lg:text-[14px] text-on-surface-variant mt-1">نماذج حقيقية من جودة الرسوم والكتب التي نصنعها لحكاياتك</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SHOWCASE.map((c) => (
                <div key={c.title} className="group bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_4px_18px_rgba(14,84,98,0.06)] flex flex-col">
                  <div className="relative h-48 w-full bg-surface-container-highest overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-sm"><span className={"text-[11px] font-bold " + c.catC}>{c.cat}</span></div>
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-inverse-surface/75 text-inverse-on-surface text-[11px] font-medium flex items-center gap-1 backdrop-blur-sm"><Icon name={c.tagIcon} size={14} />{c.tag}</div>
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[17px] text-on-surface font-bold">{c.title}</h3>
                      <span className={"text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap " + c.kindC}>{c.kind}</span>
                    </div>
                    <p className="text-[13px] text-on-surface-variant leading-relaxed">{c.d}</p>
                    <div className="pt-2 mt-auto flex items-center justify-between">
                      <button onClick={startWritten} className="h-9 px-4 rounded-full bg-primary-container text-on-primary text-[12.5px] font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
                        <Icon name="add" size={16} />اصنع مثلها
                      </button>
                      <span className="text-[12px] text-on-surface-variant flex items-center gap-1"><Icon name="bolt" size={15} className="text-secondary" fill />جاهزة فورًا</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 4. حكايات جاهزة بضغطة ===== */}
        <section className="w-full px-gutter py-10 lg:py-14 bg-surface-container-low">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div>
                <h2 className="text-[22px] lg:text-[28px] font-bold text-primary">حكايات جاهزة بضغطة</h2>
                <p className="text-[12px] lg:text-[14px] text-on-surface-variant">اختر موضوعًا مفضلًا وخصّصه بصوتك في ثوانٍ</p>
              </div>
              <span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0"><Icon name="touch_app" size={18} /></span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {READY_STORIES.map((s, i) => (
                <button key={s.id} onClick={() => setPicked(s)}
                  className="p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-high transition-colors shadow-sm flex items-center justify-between gap-3 text-right active:scale-[0.99]">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={"w-10 h-10 rounded-full flex items-center justify-center shrink-0 " + READY_TINT[i % READY_TINT.length]}><Icon name={s.icon} size={20} fill /></span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13.5px] font-bold text-on-surface truncate">{s.title}</span>
                      <span className="text-[12px] text-on-surface-variant truncate">{s.teaser}</span>
                    </div>
                  </div>
                  <span className="shrink-0 px-3 py-1.5 rounded-full bg-surface-container text-primary text-[11.5px] font-bold flex items-center gap-1"><span>ابدأ بها</span><Icon name="arrow_back" size={14} /></span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ===== آخر حكاية (للمسجّل) ===== */}
        {lastStory && (
          <section className="w-full px-gutter pt-6 bg-surface">
            <div className="max-w-6xl mx-auto">
              <span className="text-[12px] font-bold text-secondary">آخر حكاية</span>
              <button onClick={() => router.push((lastStory.hasFilm ? "/player?id=" : "/review?id=") + lastStory.id)}
                className="mt-2 w-full lg:max-w-md flex items-center gap-3 text-right bg-surface-container-lowest rounded-2xl p-3 shadow-sm active:scale-[0.99] transition-transform">
                <div className="relative w-[56px] h-[56px] rounded-xl overflow-hidden bg-primary-container shrink-0 flex items-center justify-center">
                  {lastStory.coverUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={lastStory.coverUrl} alt="" className="w-full h-full object-cover" />
                    : <Icon name="edit_note" size={24} className="text-on-primary" />}
                </div>
                <div className="flex flex-col min-w-0 flex-grow">
                  <span className="text-[14px] font-bold text-primary truncate">{lastStory.displayTitle || lastStory.title || "حكاية بدون عنوان"}</span>
                  <span className="text-[12px] text-on-surface-variant">{lastStory.hasFilm ? "جاهزة للمشاهدة" : lastStory.status === "rendering" ? "قيد الإنتاج…" : "مسودة"}{lastStory.createdAt ? ` • ${relativeDay(lastStory.createdAt)}` : ""}</span>
                </div>
                <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0"><Icon name={lastStory.hasFilm ? "play_arrow" : "arrow_back"} size={20} /></span>
              </button>
            </div>
          </section>
        )}

        {/* ===== 5. الخصوصية ===== */}
        <section className="w-full px-gutter py-6 bg-surface">
          <div className="max-w-6xl mx-auto w-full p-4 rounded-2xl bg-surface-container-lowest shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center shrink-0"><Icon name="lock" size={22} /></span>
            <div className="flex-1 min-w-0 text-right">
              <span className="text-[13px] font-bold text-primary block">أمان وخصوصية تامة</span>
              <p className="text-[12.5px] text-on-surface-variant leading-snug">ذكرياتك وصوتك وصور أطفالك ملكٌ لعائلتك وحدها، ويمكنك حذفها فورًا في أي لحظة.</p>
            </div>
          </div>
        </section>

        {/* ===== 6. خاتمة CTA ===== */}
        <section className="relative w-full px-gutter py-12 lg:py-16 bg-gradient-to-b from-primary to-primary-container text-on-primary overflow-hidden text-center rounded-t-3xl shadow-2xl">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <span className="w-14 h-14 rounded-full bg-surface-container-lowest/15 backdrop-blur-md flex items-center justify-center text-secondary-container mb-4 shadow-inner"><Icon name="auto_stories" size={32} fill /></span>
            <h2 className="text-[26px] lg:text-[36px] font-bold mb-2">ابدأ بأول حكاية… هدية</h2>
            <p className="text-[14px] lg:text-[16px] text-on-primary-container max-w-xs lg:max-w-md mb-6">اكتب قصتك الأولى الآن، واسمع صوتك الحنون يحكيها لطفلك في فيلم يبقى ذكرى لا تغيب.</p>
            <button onClick={startWritten} disabled={busy}
              className="w-full lg:w-auto lg:px-12 py-4 px-6 rounded-full bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_10px_28px_rgba(0,0,0,0.25)] active:scale-95 transition-all disabled:opacity-70">
              <Icon name={busy ? "progress_activity" : "auto_awesome"} size={22} fill className={busy ? "animate-spin" : ""} /><span>اصنع حكايتك الآن</span>
            </button>
            <div className="flex items-center justify-center gap-5 mt-8 text-[12px] text-on-primary-container">
              <a href="/about" className="hover:text-on-primary">من نحن</a>
              <span className="opacity-40">•</span>
              <a href="/pay" className="hover:text-on-primary">الأسعار</a>
              <span className="opacity-40">•</span>
              <a href="/privacy-policy" className="hover:text-on-primary">الخصوصية</a>
            </div>
            <div className="mt-6 text-[11px] text-on-primary-container/70">© حكايات العائلة</div>
          </div>
        </section>
      </main>

      {picked && (
        <ReadyStorySheet story={picked} busy={busy}
          onClose={() => { if (!busy) setPicked(null); }} onUse={useReady} />
      )}
      {/* الشريط السفلي للموبايل فقط */}
      <div className="lg:hidden"><BottomNav /></div>
    </>
  );
}
