"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import { api, type Scene } from "@/lib/api";

const BASE = "https://lh3.googleusercontent.com/aida-public/";
const FRAME = BASE + "AB6AXuAGHpa0C1gPfijYkwT6VPsXfi3phz_VMMeOTvP2Unq9IwH1ia_XGiVVr6pH-YAaqn3ON9nOlxjSxgpOkj2pJnwb1iIonzkbDGodKZesXVSRxoAA0bLLpMhGU4A0EIvd9_H-GLutLLMCygy-blnpiPb2zx9oNKsEs8_MRNhJQDCyJ0PMjF9o4dzCvs8ulOWXsrJbH4hwm7Wwksc5LmTbhOXr0138bxy_rwhUXPpp4Jn6EKqDsfdkcgcH";
const SCENES = [
  { img: BASE + "AB6AXuCMkDw1vMXO-6SjjhfGISFqd3HfXXq_by2igtP8sRBnnPLtiChVPIj1zCec0-I3sDAA7059VaNb__c9PX8cda3MeLw_bxkf7b-gq8R4qml77C-K8LHL5YRTtBHFldvKSei1Ppr-2VzvhxI3zzScXbBZTVE3yDJWZ3pWog2selkinQSVGTsXbh4dctTqwwy1tJJXglhw6_N_z4Nh2842QDamYREELHD4tBqUWT3vSGivV7Br2mR70MiJ", label: "مشهد ١", time: "00:45", t: "انطلاق الرحلة", s: "طي الطائرة وتجربتها الأولى", live: false },
  { img: BASE + "AB6AXuBF-o4EMlsV545Ru1JTqbk8M3gzOii2nvibpyq8Rgvv1rQiSmeWU4MDM4XvAOEBCCgs24rP_d5U36EwXJOnPbo_DZyWgvTj1fKUgjwVtzt48zUI1fhg6xp0SUT-AQ-XFU6bbAUooqfEs2sKMLpvujoaridMKsMqj8Ze4GoM8nEq1iUpPj0b_kp4D8FYKhspi42aNFYiRQ74wTTUnLx9M04Pn8qcPTFtNPNz289zb2WWCCmm_XXNtr21", label: "يعرض الآن", time: "00:30", t: "الطائرة في الغصن", s: "استقرار الطائرة بين أوراق السنديان", live: true },
  { img: BASE + "AB6AXuDgVFdSUuKmVFfqGjFKXLp0Zep54UX5MHOyxAwgp4mbvtNFSDeWTnufRI00Z8IKGyJiv4atPhU90LGZ687fV-0yUr4huFClGgEE82767IdH7P4i6AHxPEVPErloeXORn7jvpdoXoWiC3Ppw-ORagY5w6_vsex0zgwOw1uWP2asWvjSrmqxb5xeey1P7sJE6iNOfpHao4VUSzQWbvNyft0jr6IeWpmLJWSHI5l9j1Fo-sQF7zPIjEYWM", label: "مشهد ٣", time: "01:25", t: "ضحكة براء والطيور", s: "خاتمة الحكاية وتغريد المساء", live: false },
];

function PlayerContent() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const [muted, setMuted] = useState(false);
  const [real, setReal] = useState<Scene[] | null>(null);
  const [filmUrl, setFilmUrl] = useState<string | null>(null);
  const [bookUrl, setBookUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getScenes(id).then((s) => { if (s.length) setReal(s); }).catch(() => {});
    // اجلب رابط الفيلم (وحاول مرة أخرى إن كان قيد التجهيز)
    let tries = 0;
    const fetchFilm = () => api.getFilm(id).then((f) => {
      if (f.ready && f.videoUrl) setFilmUrl(f.videoUrl);
      else if (tries++ < 10) setTimeout(fetchFilm, 2000);
    }).catch(() => {});
    fetchFilm();
    api.getBook(id).then((b) => { if (b.ready && b.pdfUrl) setBookUrl(b.pdfUrl); }).catch(() => {});
  }, [id]);

  const openBook = () => {
    if (bookUrl) { window.open(bookUrl, "_blank"); return; }
    if (id) api.getBook(id).then((b) => {
      if (b.ready && b.pdfUrl) { setBookUrl(b.pdfUrl); window.open(b.pdfUrl, "_blank"); }
      else alert("الكتاب المصوّر قيد التجهيز — جرّب بعد لحظات.");
    }).catch(() => alert("تعذّر جلب الكتاب."));
  };

  // المشاهد المولّدة الحقيقية إن وُجدت، وإلا الأمثلة
  const frame = real && real[0]?.imageUrl ? real[0].imageUrl : FRAME;
  const rail = real
    ? real.map((s, i) => ({ img: s.imageUrl || FRAME, label: i === 0 ? "يعرض الآن" : "مشهد " + s.order, time: "00:30", t: s.title, s: s.caption, live: i === 0 }))
    : SCENES;

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <button onClick={() => router.push("/archive")} className="w-11 h-11 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-low"><Icon name="arrow_forward" size={24} /></button>
            <div className="flex flex-col"><h1 className="text-[17px] font-semibold text-primary">مشغّل الفيلم</h1><span className="text-[12px] text-on-surface-variant">استوديو حكايات العائلة</span></div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-secondary-container shadow"><Icon name="movie" size={18} fill /></div>
        </div>
      </header>

      <main className="flex flex-col w-full px-margin pt-space-md pb-8 flex-grow">
        <div className="flex flex-col gap-1.5 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[12px]"><Icon name="auto_stories" size={16} fill />فيلم مصوّر تذكاري</span>
            <span className="inline-flex items-center gap-1 text-on-surface-variant text-[12px]"><Icon name="mic" size={15} className="text-secondary" />مسجلة بصوت الأب (عمّار)</span>
          </div>
          <div className="flex items-baseline justify-between mt-1"><h2 className="text-[26px] leading-[38px] font-bold text-primary tracking-tight">طائرة براء الزرقاء</h2><span className="text-[12px] text-on-surface-variant">١٤ تشرين الأول ٢٠٢٤</span></div>
        </div>

        {/* Video canvas — مشغّل فيديو حقيقي */}
        <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-primary shadow-[0_16px_36px_-6px_rgba(27,59,54,0.18)] flex flex-col">
          {filmUrl ? (
            <video
              src={filmUrl}
              poster={frame}
              controls
              playsInline
              muted={muted}
              className="absolute inset-0 w-full h-full object-cover bg-primary"
            />
          ) : (
            <>
              <img alt="لقطة من الفيلم" className="absolute inset-0 w-full h-full object-cover" src={frame} />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-primary/40 flex flex-col items-center justify-center gap-3 text-on-primary">
                <Icon name="movie" size={40} className="animate-pulse" />
                <span className="text-[14px] font-medium">جارٍ تجهيز الفيلم...</span>
              </div>
            </>
          )}
        </div>

        {/* Scenes rail */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Icon name="movie" size={20} className="text-secondary" /><h3 className="text-[17px] font-semibold text-primary">مشاهد الحكاية المصوّرة</h3></div>
            <span className="text-[12px] text-on-surface-variant">٣ فصول متسلسلة</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-margin px-margin scroll-smooth">
            {rail.map((sc, i) => (
              <div key={i} className="shrink-0 w-44 flex flex-col gap-2 p-2.5 rounded-2xl bg-surface-container-lowest shadow-[0_8px_24px_-4px_rgba(31,36,33,0.05)] cursor-pointer active:scale-95">
                <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-surface-container">
                  <img alt={sc.t} className="w-full h-full object-cover" src={sc.img} />
                  {sc.live
                    ? <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />{sc.label}</span>
                    : <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-surface-container-lowest/90 text-[11px] text-primary font-semibold">{sc.label}</span>}
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-primary-container/85 text-on-primary text-[10px]">{sc.time}</span>
                </div>
                <div className="flex flex-col"><span className="text-[14px] text-primary font-medium truncate">{sc.t}</span><span className="text-[12px] text-on-surface-variant truncate">{sc.s}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick tune */}
        <div className="mt-4 flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button className="flex items-center justify-center gap-2 py-3 px-3.5 rounded-2xl bg-surface-container-low text-primary hover:bg-surface-container active:scale-95"><Icon name="edit_note" size={19} className="text-secondary" /><span className="text-[14px] font-medium">تعديل مشهد معين</span></button>
            <button className="flex items-center justify-center gap-2 py-3 px-3.5 rounded-2xl bg-surface-container-low text-primary hover:bg-surface-container active:scale-95"><Icon name="tune" size={19} className="text-secondary" /><span className="text-[14px] font-medium">الخلفية الصوتية</span></button>
          </div>
          <span className="text-[12px] text-on-surface-variant text-center px-2">يمكنك تعديل أي مشهد أو إعادة تسجيله منفرداً دون المساس ببقية الفيلم.</span>
        </div>

        {/* Archival actions */}
        <div className="mt-6 flex flex-col gap-3">
          <button onClick={() => router.push("/archive")} className="w-full h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center gap-2.5 shadow-[0_6px_20px_rgba(27,59,54,0.18)] active:scale-[0.98]"><Icon name="inventory_2" size={22} /><span className="text-[17px] font-medium">حفظ الفيلم في أرشيف العائلة الخاص</span></button>
          <button onClick={openBook} className="w-full h-14 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center gap-2.5 shadow-[0_6px_18px_rgba(217,130,59,0.22)] active:scale-[0.98]"><Icon name="menu_book" size={22} fill /><span className="text-[17px] font-semibold">{bookUrl ? "تحميل الكتاب المصوّر (PDF)" : "الكتاب المصوّر — عرض/تحميل"}</span></button>
          <button className="w-full py-3.5 px-4 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(31,36,33,0.04)] active:scale-[0.98]"><Icon name="lock" size={20} className="text-on-surface-variant" /><span className="text-[14px] font-medium">مشاركة خاصة وآمنة مع العائلة عبر رابط مشفر</span></button>
          <p className="flex items-center justify-center gap-1.5 text-[12px] text-on-surface-variant"><Icon name="verified_user" size={14} />مشفر بالكامل وخاص فقط بحساب عائلة براء</p>
        </div>
      </main>
    </>
  );
}

export default function PlayerPage() {
  return <Suspense fallback={<div className="min-h-screen" />}><PlayerContent /></Suspense>;
}
