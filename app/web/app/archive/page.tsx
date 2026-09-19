"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { api, getToken, type Story } from "@/lib/api";

// وصف حالة الحكاية بالعربي + التنقّل المناسب
function statusOf(s: Story): { label: string; icon: string; tone: string } {
  if (s.hasFilm) return { label: "جاهزة للمشاهدة", icon: "play_circle", tone: "text-secondary" };
  if (s.status === "rendering") return { label: "قيد الإنتاج…", icon: "hourglass_top", tone: "text-on-surface-variant" };
  if (s.status === "text_approved" || s.textApproved) return { label: "جاهزة للتوليد", icon: "auto_awesome", tone: "text-primary" };
  return { label: "مسودة", icon: "edit_note", tone: "text-on-surface-variant" };
}

export default function ArchivePage() {
  const router = useRouter();
  const [mine, setMine] = useState<Story[] | null>(null);

  useEffect(() => {
    if (!getToken()) { setMine([]); return; }
    api.listStories().then(setMine).catch(() => setMine([]));
  }, []);

  const open = (s: Story) => {
    if (s.hasFilm) router.push("/player?id=" + s.id);
    else router.push("/review?id=" + s.id);
  };

  const count = mine?.length ?? 0;
  const ready = mine?.filter((s) => s.hasFilm).length ?? 0;

  return (
    <>
      <AppHeader tab="أرشيف العائلة" icon="photo_album" />
      <main className="flex flex-col w-full px-margin pt-space-md pb-28 flex-grow gap-space-md">
        {/* Intro (أرقام حقيقية) */}
        <section className="flex flex-col bg-surface-container-low rounded-xl p-space-md shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-secondary-fixed/30 blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5"><Icon name="menu_book" size={22} className="text-secondary" /><h2 className="text-[22px] leading-[32px] font-semibold text-primary">خزانة ذكريات العائلة 📚</h2></div>
              <p className="text-[13px] text-on-surface-variant">
                {count > 0 ? `${count} حكاية محفوظة • ${ready} جاهزة للمشاهدة` : "لا حكايات بعد — ابدأ بتخليد ذكرى"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-primary shadow-sm"><Icon name="auto_awesome" size={20} /></div>
          </div>
        </section>

        {/* Loading */}
        {mine === null && (
          <div className="py-16 flex justify-center text-on-surface-variant"><Icon name="progress_activity" size={30} className="animate-spin" /></div>
        )}

        {/* Empty */}
        {mine && mine.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-space-lg flex flex-col items-center text-center gap-3 mt-space-sm">
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-secondary-container"><Icon name="auto_stories" size={32} /></div>
            <p className="text-[15px] text-primary font-semibold">لسه مفيش حكايات في الأرشيف</p>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">كل حكاية تنشئها تتحفظ هنا تلقائيًا — فيلمها وكتابها المصوّر.</p>
            <button onClick={() => router.push("/")} className="mt-1 h-11 px-6 rounded-full bg-primary-container text-on-primary text-[14px] font-semibold flex items-center gap-2 active:scale-95"><Icon name="add" size={20} /><span>ابدأ حكاية</span></button>
          </div>
        )}

        {/* Real stories */}
        {mine && mine.length > 0 && (
          <section className="flex flex-col gap-space-sm">
            {mine.map((s) => {
              const st = statusOf(s);
              return (
                <button key={s.id} onClick={() => open(s)} className="flex items-center justify-between bg-surface-container-lowest rounded-xl p-space-sm shadow-sm text-right active:scale-[0.99] hover:bg-surface-container-low">
                  <div className="flex items-center gap-space-sm min-w-0">
                    {/* غلاف مصغّر: أول مشهد إن وُجد، وإلا أيقونة */}
                    <div className="relative w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-primary-container flex items-center justify-center text-secondary-container">
                      {s.coverUrl
                        ? <img src={s.coverUrl} alt="" className="w-full h-full object-cover" />
                        : <Icon name={s.sourceKind === "written" ? "edit_note" : "mic"} size={24} />}
                      {s.hasFilm && (
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center"><Icon name="play_arrow" size={20} className="text-primary" /></div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[15px] text-primary font-semibold truncate">{s.displayTitle || s.title || "حكاية بدون عنوان"}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Icon name={st.icon} size={14} className={st.tone} />
                        <span className={"text-[12px] " + st.tone}>{st.label}</span>
                      </div>
                      {s.createdAt && <span className="text-[11px] text-on-surface-variant mt-0.5">{new Date(s.createdAt).toLocaleDateString("ar-EG")}</span>}
                    </div>
                  </div>
                  <Icon name="chevron_left" size={22} className="text-on-surface-variant shrink-0" />
                </button>
              );
            })}
          </section>
        )}

        {/* Poetic footer */}
        <div className="bg-surface-container-high rounded-xl p-space-md flex items-center gap-space-sm">
          <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary shrink-0 shadow-sm"><Icon name="bookmark" size={20} /></div>
          <div className="flex flex-col"><span className="text-[14px] font-semibold text-primary">صوتك اليوم كنز الغد</span><span className="text-[13px] text-on-surface-variant">كل حكاية تحفظها تبقى لأطفالك وأحفادك.</span></div>
        </div>
      </main>

      <button onClick={() => router.push("/")} className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 px-6 h-12 rounded-full bg-secondary text-on-secondary text-[14px] font-semibold flex items-center gap-2 shadow-[0_6px_18px_rgba(217,130,59,0.35)] active:scale-95">
        <Icon name="mic" size={20} /><span>+ تخليد ذكرى جديدة</span>
      </button>
      <BottomNav />
    </>
  );
}
