"use client";
import { useEffect } from "react";
import Icon from "@/components/Icon";

/** صفحة هبوط كاملة العرض (للإعلانات) — خارج إطار الهاتف، مستجيبة للموبايل والديسكتوب. */

const REGISTER = "/login?mode=register";

const STEPS = [
  { n: "١", icon: "edit_note", t: "اكتب الحكاية", d: "اكتب القصة التي تريدها بكل تفاصيلها، أو اختر حكاية جاهزة." },
  { n: "٢", icon: "mic", t: "أضف صوتك", d: "اقرأ النص مرة واحدة، فنستنسخ صوتك ليروي الفيلم بنبرتك." },
  { n: "٣", icon: "movie", t: "شاهد الفيلم", d: "نحوّل قصتك إلى فيلم متحرك وكتاب مصوّر بطله طفلك." },
];

const FEATURES = [
  { icon: "diversity_1", t: "لكل الأعمار", d: "قصص عائلية وتعليمية" },
  { icon: "star", t: "جودة عالية", d: "رسوم بأسلوب سينمائي" },
  { icon: "verified_user", t: "آمن وموثوق", d: "خصوصيتك في أمان تام" },
  { icon: "bolt", t: "سهل وسريع", d: "خطوات في دقائق" },
  { icon: "favorite", t: "يجمع العائلة", d: "أنت وطفلك الأبطال" },
];

const SHOWCASE = [
  { img: "/scenes/waterfall.png", cat: "مغامرة", color: "bg-secondary-container text-on-secondary-container", title: "الغابة والشلال" },
  { img: "/scenes/bird-nest.png", cat: "قيم وسلوك", color: "bg-primary-container text-on-primary", title: "العصفور الصغير" },
  { img: "/scenes/village.jpg", cat: "ذكريات عائلية", color: "bg-tertiary-fixed text-tertiary", title: "حارتنا القديمة" },
  { img: "/scenes/bird-hold.jpg", cat: "تعليمية", color: "bg-secondary-fixed text-on-secondary-fixed", title: "الرفق بالحيوان" },
];

const VALUES = [
  { i: "🎙️", t: "صوتك ذكرى تبقى", d: "صوتك يحكي لطفلك اليوم، ويبقى لأحفادك يسمعون به جدّهم بعد سنوات." },
  { i: "🌱", t: "قيمك بحكايتك أنت", d: "ليست قصة جاهزة مفروضة. علّم طفلك القيم بشكل غير مباشر، من خلال بطل يشبهه." },
  { i: "🌍", t: "لغتك وهويتك في الغربة", d: "طفلك يسمع العربية بصوت أبيه وبلهجة أهله، فتبقى لغته وهويته حيّة." },
];

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.add("landing");
    return () => document.documentElement.classList.remove("landing");
  }, []);

  return (
    <div className="bg-surface text-on-surface">
      {/* ===== الترويسة ===== */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/40">
        <div className="max-w-6xl mx-auto h-16 px-5 flex items-center justify-between gap-3">
          <a href="/landing" className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="حكايات العائلة" className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0" />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[15px] font-extrabold text-primary truncate">حكايات العائلة</span>
              <span className="text-[10.5px] text-on-surface-variant truncate hidden sm:block">لحظات من الماضي… لذكريات المستقبل</span>
            </div>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-[14px] font-semibold text-on-surface-variant">
            <a href="#how" className="hover:text-primary transition-colors">كيف تعمل؟</a>
            <a href="#showcase" className="hover:text-primary transition-colors">القصص</a>
            <a href="#why" className="hover:text-primary transition-colors">لماذا نحن</a>
            <a href="/pay" className="hover:text-primary transition-colors">الأسعار</a>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <a href="/login" className="hidden sm:inline-flex items-center h-9 px-3 text-[13px] font-semibold text-primary hover:bg-surface-container-low rounded-full">تسجيل الدخول</a>
            <a href={REGISTER} className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-primary text-white text-[13px] font-bold shadow-sm active:scale-95 transition-transform"><Icon name="arrow_back" size={16} />ابدأ الآن</a>
          </div>
        </div>
      </header>

      {/* ===== الهيرو ===== */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_90%_at_75%_20%,#1F4A43_0%,#123832_50%,#0A1F1B_100%)] text-white">
        <div className="max-w-6xl mx-auto px-5 pt-12 md:pt-16 pb-28 md:pb-32 grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-center md:text-right order-2 md:order-1">
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[rgba(217,130,59,0.18)] border border-[rgba(217,130,59,0.35)] text-[#F5C989] text-[12px] font-semibold mb-5">
              <Icon name="auto_awesome" size={15} fill />بالذكاء الاصطناعي
            </span>
            <h1 className="text-[34px] leading-[48px] md:text-[46px] md:leading-[62px] font-extrabold text-balance">
              اكتب حكايتك<br />وبصوتك نصنع <span className="text-[#F5C989]">فيلمها</span>
            </h1>
            <p className="text-[16px] md:text-[18px] text-[#B9D2CB] leading-relaxed mt-5 max-w-lg mx-auto md:mx-0">
              حوّل قصصك العائلية إلى أفلام قصيرة وكتب مصوّرة، بطلها طفلك وراويها أنت — واحتفظ بذكريات لا تُنسى.
            </p>
            <div className="flex flex-col sm:flex-row items-center md:items-start gap-3 mt-7 justify-center md:justify-start">
              <a href={REGISTER} className="h-14 px-8 rounded-full bg-gradient-to-b from-[#EE9A52] to-[#C96A24] text-white text-[16px] font-bold flex items-center gap-2 shadow-lg active:scale-[0.98] transition-transform">
                <Icon name="auto_stories" size={20} fill />ابدأ بأول حكاية هدية 🎁
              </a>
              <a href="#how" className="h-14 px-6 rounded-full border border-white/25 text-white text-[15px] font-semibold flex items-center gap-2 hover:bg-white/5">
                <Icon name="play_circle" size={20} />كيف تعمل؟
              </a>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-[rgba(245,201,137,0.35)] aspect-[16/10]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/scenes/waterfall.png" alt="مشهد من فيلم أنتجناه" className="w-full h-full object-cover" />
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-black/45 backdrop-blur text-[11px] font-semibold text-white">
                <Icon name="movie" size={14} fill />من إنتاجنا الحقيقي
              </span>
            </div>
          </div>
        </div>

        {/* بطاقة الخطوات العائمة */}
        <div className="relative max-w-5xl mx-auto px-5 -mb-16" id="how">
          <div className="bg-surface rounded-3xl shadow-[0_20px_50px_-15px_rgba(3,37,33,0.35)] p-5 md:p-7 grid md:grid-cols-[1fr_auto] gap-5 items-center">
            <div className="grid sm:grid-cols-3 gap-5">
              {STEPS.map((s) => (
                <div key={s.n} className="flex items-start gap-3 text-right">
                  <span className="relative shrink-0">
                    <span className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center"><Icon name={s.icon} size={24} fill /></span>
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-secondary text-white text-[11px] font-bold flex items-center justify-center">{s.n}</span>
                  </span>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold text-primary">{s.t}</div>
                    <div className="text-[12px] text-on-surface-variant leading-snug mt-0.5">{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <a href={REGISTER} className="w-full md:w-auto h-14 px-8 rounded-full bg-gradient-to-b from-[#EE9A52] to-[#C96A24] text-white text-[16px] font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform whitespace-nowrap">
              <Icon name="arrow_back" size={20} />ابدأ الآن
            </a>
          </div>
        </div>
      </section>

      {/* ===== المزايا ===== */}
      <section className="pt-28 md:pt-28 pb-14">
        <div className="max-w-6xl mx-auto px-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {FEATURES.map((f) => (
            <div key={f.t} className="flex flex-col items-center text-center gap-2">
              <span className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center text-secondary shadow-sm"><Icon name={f.icon} size={30} fill /></span>
              <div className="text-[15px] font-bold text-primary">{f.t}</div>
              <div className="text-[12px] text-on-surface-variant -mt-1">{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== لماذا نحن ===== */}
      <section id="why" className="bg-surface-container-low py-16">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-9">
            <h2 className="text-[28px] md:text-[32px] font-extrabold text-primary">لماذا حكايات العائلة؟</h2>
            <p className="text-[14px] text-on-surface-variant mt-2">فكرة مختلفة: طفلك بطل الحكاية… وأنت الراوي.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {VALUES.map((v) => (
              <div key={v.t} className="bg-surface rounded-2xl p-6 shadow-sm flex flex-col gap-2">
                <span className="text-[34px] leading-none" aria-hidden>{v.i}</span>
                <div className="text-[18px] font-bold text-primary mt-1">{v.t}</div>
                <div className="text-[14px] text-on-surface-variant leading-relaxed">{v.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== المعرض ===== */}
      <section id="showcase" className="py-16">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-8">
            <h2 className="text-[28px] md:text-[32px] font-extrabold text-primary">قصص من قلب العائلة</h2>
            <p className="text-[14px] text-on-surface-variant mt-2">نماذج حقيقية من جودة الرسوم التي نصنعها لحكاياتك</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {SHOWCASE.map((c) => (
              <a key={c.title} href={REGISTER} className="group text-right rounded-2xl overflow-hidden bg-surface shadow-sm hover:shadow-xl transition-shadow">
                <div className="relative aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className={"absolute top-2.5 right-2.5 h-6 px-2.5 rounded-full text-[11px] font-bold flex items-center " + c.color}>{c.cat}</span>
                </div>
                <div className="p-4">
                  <div className="text-[15px] font-bold text-primary truncate">{c.title}</div>
                  <div className="text-[12px] text-secondary font-semibold mt-1 flex items-center gap-1"><Icon name="add" size={15} />اصنع مثلها</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== خاتمة CTA ===== */}
      <section className="bg-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-5 text-center flex flex-col items-center gap-5">
          <h2 className="text-[28px] md:text-[34px] font-extrabold text-balance">ابدأ بأول حكاية… <span className="text-[#F5C989]">هدية</span></h2>
          <p className="text-[15px] text-[#B9D2CB] max-w-lg">اكتب قصتك الأولى الآن، واسمع صوتك يحكيها لطفلك. بلا التزام، وأول حكاية علينا.</p>
          <a href={REGISTER} className="h-14 px-10 rounded-full bg-gradient-to-b from-[#EE9A52] to-[#C96A24] text-white text-[16px] font-bold flex items-center gap-2 shadow-lg active:scale-[0.98] transition-transform">
            <Icon name="auto_stories" size={20} fill />اصنع حكايتك 🎁
          </a>
        </div>
      </section>

      {/* ===== التذييل ===== */}
      <footer className="bg-[#0A1F1B] text-[#8FB0A8] py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="" className="w-9 h-9 rounded-lg object-cover" />
            <span className="text-[14px] font-bold text-white">حكايات العائلة</span>
          </div>
          <div className="flex items-center gap-5 text-[13px]">
            <a href="/about" className="hover:text-white">من نحن</a>
            <a href="/pay" className="hover:text-white">الأسعار</a>
            <a href="/terms" className="hover:text-white">الشروط</a>
            <a href="/privacy-policy" className="hover:text-white">الخصوصية</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
