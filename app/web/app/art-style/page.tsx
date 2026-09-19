"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import { api } from "@/lib/api";

const BASE = "https://lh3.googleusercontent.com/aida-public/";
const STYLES = [
  { img: BASE + "AB6AXuDOHflh5Lwae_pUza9a9KIUbjj7XGjx-4bKZBzmn6gY8X6Q83_o66Y-d9dLhlD2Abb0097dVD9fVrUf8UsE-XcuoI8Z9PojH8VBYrmiXeEOgWd1erwUkpQa33AxH2vfXJn8CvoKJ-t2tdVsz55tVvjD6PN4fyYqN4I5zbKDpZIEKAbmcf8KRUuU-qyQZ6r0Wi_iCMtNS1LaTtWyutNojSI1G9QK7kRYgs_xUbRnHZpKjhaxiR7QB99y", t: "دفء الألوان المائية", d: "حواف انسيابية مائية ناعمة مع درجات ترابية مشبعة بدفء البيوت القديمة وحميميتها.", tag: "طابع أدبي كلاسيكي", rec: true },
  { img: BASE + "AB6AXuDSgEsjivmc8w_Oitrb_Plu8S6lQN3hz-K0XE3k0gk5DPLE8-SQ4odkq1QZ5Hp88gT2glb85BMxd_Ae8EPUFBkHMirYwALrIk738Pai5Bse4xtKVfdU9dFCV9VfjLueV1V2N8HmGV7fqYOJ1fNPo85YkH3zwdszLDCDpQcu63pHvuFSGggVvCcyIBok8GcG5TxQSjQ63Ztpcp23Z2TSGOLetEM7EdzWYttEEmp7wlMZbIopRuSPd8Nm", t: "القصاصات الورقية والظل", d: "استلهام مسرح الخيال والظلال الشرقية بطبقات ورقية معمارية راقية وإضاءة ساحرة.", tag: "طبقات درامية هادئة" },
  { img: BASE + "AB6AXuAy_4Jr_Xw8v2prtNBK_pAWpCAs6iozDaq-op2rdLxX7cv5RezPCL-ceYz2-Y-vB_Y7tRrwMmrcEJt59Rrn2wTLiTlGXKRoDLUFuPs33PlP3aAtgX6GshWyTNyUpr-KPhnYBV0PZdXQGykK7QzKd16wOJaR75PdHood0eOJhwX-uXSCxg9bIjqPMIQ5zbc89d_7egGWTMvXGWe_SoUGdrHlkVn9x6tJfU-L5FhAWwv0RVqoKDVn3W6f", t: "الرسم الزيتي الوقور", d: "ملامح تعبيرية عميقة مع ارتدادات ذهبية لشمس الأصيل، تحاكي لوحات المتاحف.", tag: "فخامة الألبومات القديمة" },
  { img: BASE + "AB6AXuA3U2XWPm5DRKeRHDcW4YqWm14DxaXEk104vQ2eJbnI2P8xVyrO8EOCL-Ja6Yk-c7enjcFXKqMBML_simcB-H_6HMj2Ukmzmqkf3othpv6M0fvKfX4ibG6lW1dPsOioehWNHGHigCxZJ9UddT8jgYbAYM8pAo_McyEBSLe024fzx_YR0aaqphK3borWI7sHFF1e4OBayP7dOJoTjFnYbn4TtYpjzKAxOgeqXIb6zNPbook4jgzjgFBV", t: "الخطوط العفوية اليدوية", d: "بساطة صادقة تحاكي رسومات المذكرات اليدوية وهوامش كتب العائلة التذكارية.", tag: "عفوية المذكرات" },
];
const AUDIO = [
  { icon: "music_note", t: "تقاسيم عود هادئة وأصوات طبيعة", s: "رنين خفيف ونسائم ماء دافئة" },
  { icon: "piano", t: "بيانو دافئ مع نسائم ريفية", s: "أنغام وجدانية ناعمة وتأملية" },
  { icon: "mic", t: "نقاء الصوت الأصلي فقط", s: "صوت الراوي النقي بلا خلفية موسيقية" },
];

function ArtStyleContent() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const [style, setStyle] = useState(0);
  const [audio, setAudio] = useState(0);
  const [busy, setBusy] = useState(false);

  const startRender = async () => {
    if (!id) { router.push("/generating"); return; }
    setBusy(true);
    try {
      const job = await api.generateScenes(id, 4);
      router.push("/generating?id=" + id + "&job=" + job.id);
    } catch {
      router.push("/generating?id=" + id);
    } finally { setBusy(false); }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <button onClick={() => router.push("/characters")} className="w-11 h-11 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-low"><Icon name="arrow_forward" size={24} /></button>
            <div className="flex flex-col"><h1 className="text-[17px] font-semibold text-primary">اختيار الطابع البصري</h1><span className="text-[12px] text-on-surface-variant">استوديو حكايات العائلة</span></div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-secondary-container shadow"><Icon name="palette" size={18} fill /></div>
        </div>
      </header>

      <main className="flex flex-col w-full px-margin pt-space-md pb-8 flex-grow">
        <div className="flex flex-col gap-1 mb-6 mt-1">
          <div className="flex items-center gap-2 text-secondary"><Icon name="palette" size={20} fill /><span className="text-[14px] font-medium">اللمسة الفنية للأجيال</span></div>
          <h2 className="text-[22px] leading-[32px] font-semibold text-primary tracking-tight">اختر الطابع البصري لحكايتك</h2>
          <p className="text-[13px] text-on-surface-variant leading-relaxed mt-1">جميع الأنماط مصممة بعناية لتلائم الوقار والدفء العائلي، بجماليات فنية هادئة مستوحاة من دفاتر الذكريات القديمة ومقتنيات التراث.</p>
        </div>

        {/* Styles */}
        <div className="flex flex-col gap-3.5 mb-8">
          {STYLES.map((st, i) => {
            const on = style === i;
            return (
              <div key={i} onClick={() => setStyle(i)} className={`relative rounded-xl bg-surface-container-lowest p-3.5 shadow-sm cursor-pointer overflow-hidden group transition-all ${on ? "ring-2 ring-secondary/40" : ""}`}>
                {on && <div className="absolute inset-0 bg-secondary-container/10 pointer-events-none" />}
                <div className="flex gap-3.5 items-center relative">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container shadow-inner">
                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={st.img} alt={st.t} />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
                    {st.rec && <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-surface/90 backdrop-blur-sm text-primary text-[10px] flex items-center gap-0.5"><Icon name="auto_awesome" size={12} fill />مُوصى به</span>}
                  </div>
                  <div className="flex flex-col flex-grow min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-[17px] font-semibold text-primary truncate">{st.t}</h3>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-transform ${on ? "bg-secondary text-on-secondary shadow-sm" : "bg-surface-container-high text-transparent"}`}><Icon name="check" size={14} /></div>
                    </div>
                    <p className="text-[13px] text-on-surface-variant line-clamp-2 leading-relaxed">{st.d}</p>
                    <div className="flex items-center gap-2 mt-2"><span className={`text-[11px] px-2 py-0.5 rounded-full ${on ? "text-secondary bg-secondary-container/20" : "text-on-surface-variant bg-surface-container"}`}>{st.tag}</span></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Audio */}
        <div className="flex flex-col gap-3 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Icon name="graphic_eq" size={20} fill className="text-secondary" /><h3 className="text-[17px] font-semibold text-primary">المرافقة الصوتية للرواية</h3></div>
            <span className="text-[12px] text-on-surface-variant">موسيقى هادئة منسجمة</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {AUDIO.map((a, i) => {
              const on = audio === i;
              return (
                <div key={i} onClick={() => setAudio(i)} className={`flex items-center justify-between p-3.5 rounded-xl bg-surface-container-lowest shadow-sm cursor-pointer transition-all ${on ? "" : "opacity-80 hover:opacity-100"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${on ? "bg-secondary-container/20 text-secondary" : "bg-surface-container text-on-surface-variant"}`}><Icon name={a.icon} size={20} /></div>
                    <div className="flex flex-col"><span className="text-[14px] font-medium text-primary">{a.t}</span><span className="text-[12px] text-on-surface-variant">{a.s}</span></div>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${on ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-high text-transparent"}`}><Icon name="done" size={13} /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sticky bottom-4 z-20 pt-2">
          <button disabled={busy} onClick={startRender} className="w-full h-[52px] bg-primary text-on-primary rounded-full text-[14px] font-medium flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] disabled:opacity-60"><span>{busy ? "جارٍ البدء..." : "بدء تجهيز الفيلم القصير"}</span><Icon name={busy ? "progress_activity" : "arrow_forward"} size={18} className={busy ? "animate-spin" : "rotate-180"} /></button>
          <div className="flex items-center justify-center gap-1.5 mt-2.5 text-on-surface-variant"><Icon name="hourglass_top" size={14} /><span className="text-[11px]">يستغرق تجميع المشاهد الموسيقية قرابة دقيقتين</span></div>
        </div>
      </main>
    </>
  );
}

export default function ArtStylePage() {
  return <Suspense fallback={<div className="min-h-screen" />}><ArtStyleContent /></Suspense>;
}
