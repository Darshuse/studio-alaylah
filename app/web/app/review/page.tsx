"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import { ReadyStoryRow, ReadyStorySheet } from "@/components/ReadyStoryPicker";
import type { ReadyStory } from "@/lib/readyStories";
import { api, getToken } from "@/lib/api";

function ReviewContent() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [sourceKind, setSourceKind] = useState<string>("written");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | "draft" | "approve">(null);
  const [err, setErr] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);
  const [picked, setPicked] = useState<ReadyStory | null>(null);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const canSave = words > 0 && !!id;

  useEffect(() => {
    if (!id || !getToken()) { setLoading(false); return; }
    api.getStory(id)
      .then((s) => { setText(s.text || ""); setTitle(s.title || ""); setSourceKind(s.sourceKind); })
      .catch(() => setErr("تعذّر تحميل الحكاية."))
      .finally(() => setLoading(false));
  }, [id]);

  const saveDraft = async () => {
    if (!id) return;
    setBusy("draft"); setErr(null);
    try { if (title.trim()) await api.setTitle(id, title.trim()); await api.saveText(id, text); setSavedNote(true); setTimeout(() => setSavedNote(false), 2000); }
    catch { setErr("تعذّر حفظ المسودة."); }
    finally { setBusy(null); }
  };

  const approveAndNext = async () => {
    if (!id) { router.push("/characters"); return; }
    setBusy("approve"); setErr(null);
    try {
      if (title.trim()) await api.setTitle(id, title.trim());
      await api.saveText(id, text);
      await api.approveText(id);
      router.push("/voice?id=" + id);
    } catch { setErr("تعذّر اعتماد النص."); setBusy(null); }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <button onClick={() => router.push("/")} className="w-11 h-11 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-low"><Icon name="arrow_forward" size={24} /></button>
            <div className="flex flex-col"><h1 className="text-[17px] font-semibold text-primary">مراجعة الحكاية</h1><span className="text-[12px] text-on-surface-variant">استوديو حكايات العائلة</span></div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-secondary-container shadow"><Icon name="auto_stories" size={18} fill /></div>
        </div>
      </header>

      <main className="flex flex-col w-full px-margin pt-space-md pb-8 flex-grow">
        {/* Honest source badge */}
        <div className="inline-flex items-center self-start gap-space-xs px-3 py-1.5 rounded-full bg-surface-container-high text-primary mb-3 shadow-sm">
          <Icon name={sourceKind === "voice" ? "mic" : "edit_note"} size={18} className="text-secondary" />
          <span className="text-[12px] font-semibold">{sourceKind === "voice" ? "تسجيلك الصوتي محفوظ" : "حكاية مكتوبة"}</span>
        </div>

        <div className="flex flex-col gap-1 mb-4">
          <h2 className="text-[22px] leading-[32px] font-semibold text-primary">اكتب حكايتك كما تريدها</h2>
          <p className="text-[13px] text-on-surface-variant">
            {sourceKind === "voice"
              ? "سجّلت صوتك — دوّن حكايتك هنا بكلماتك لتُحفظ مع التسجيل. (التفريغ التلقائي قريبًا.)"
              : "اكتب موقفًا طريفًا أو ذكرى دافئة بكلماتك — أو اختر حكاية جاهزة. وبعد الاعتماد ستقرأ النص بصوتك ليُروى الفيلم بصوتك."}
          </p>
        </div>

        {!loading && !text.trim() && (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[14px] font-bold text-primary">حكايات جاهزة</span>
              <span className="text-[12px] text-secondary font-semibold">اضغط واستخدمها</span>
            </div>
            <ReadyStoryRow onOpen={setPicked} />
          </div>
        )}

        {/* Title */}
        <div className="w-full bg-surface-container-lowest rounded-xl p-4 shadow-sm mb-3">
          <div className="flex items-center gap-2 mb-2"><Icon name="title" size={18} className="text-secondary" /><span className="text-[12px] text-on-surface-variant font-semibold">عنوان الحكاية</span></div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            dir="rtl"
            placeholder="مثلًا: يوسف والعصفور"
            className="w-full h-11 text-[17px] font-semibold text-primary bg-surface-container-low rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/50 placeholder:font-normal text-right"
          />
          <p className="text-[11px] text-on-surface-variant mt-1.5">هذا العنوان يظهر على الفيلم والكتاب وفي الأرشيف. لو تركته فارغًا سنشتقّه من أول القصة.</p>
        </div>

        {/* Real editor */}
        <div className="w-full bg-surface-container-lowest rounded-xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Icon name="menu_book" size={20} fill className="text-secondary" /><span className="text-[12px] text-on-surface-variant font-semibold">مسودة الحكاية</span></div>
            <div className="flex items-center gap-1 text-on-surface-variant text-[12px] bg-surface-container-low px-2 py-0.5 rounded-full"><Icon name="history_edu" size={14} /><span>{words} كلمة</span></div>
          </div>
          {loading ? (
            <div className="min-h-[180px] flex items-center justify-center text-on-surface-variant"><Icon name="progress_activity" size={24} className="animate-spin" /></div>
          ) : (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              dir="rtl"
              placeholder="اكتب حكايتك هنا... مثلًا: في عصر يوم الجمعة، ذهبنا أنا وبراء إلى الحديقة القديمة، وحدث أمر لن ننساه..."
              className="w-full min-h-[200px] text-[17px] leading-relaxed text-primary bg-transparent resize-y focus:outline-none placeholder:text-on-surface-variant/60 text-right"
            />
          )}
        </div>

        {err && <p className="text-[13px] text-error bg-error-container/50 rounded-lg px-3 py-2 mb-3">{err}</p>}
        {savedNote && <p className="text-[13px] text-primary bg-primary-fixed/50 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5"><Icon name="check_circle" size={16} />تم حفظ المسودة.</p>}

        {/* Actions */}
        <div className="flex flex-col gap-2.5 mb-5">
          <button disabled={!canSave || busy !== null} onClick={approveAndNext} className="w-full h-[52px] rounded-full bg-primary-container text-on-primary text-[17px] font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] disabled:opacity-50">
            <span>{busy === "approve" ? "جارٍ الاعتماد..." : "اعتماد النص ثم قراءته بصوتك"}</span>
            <Icon name={busy === "approve" ? "progress_activity" : "arrow_back"} size={20} className={busy === "approve" ? "animate-spin" : ""} />
          </button>
          <button disabled={!canSave || busy !== null} onClick={saveDraft} className="w-full h-[46px] rounded-full bg-surface-container-high text-primary text-[14px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50">
            <Icon name={busy === "draft" ? "progress_activity" : "bookmark_add"} size={18} className={busy === "draft" ? "animate-spin" : ""} /><span>حفظ كمسودة</span>
          </button>
          {!canSave && !loading && <p className="text-center text-[12px] text-on-surface-variant">اكتب بضع كلمات لتفعيل الحفظ.</p>}
        </div>

        <div className="w-full bg-surface-container-low rounded-xl p-3 flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0"><Icon name="verified_user" size={18} className="text-primary" /></div>
          <p className="text-[12px] text-on-surface-variant leading-snug">خصوصيتكم أمانة: حكايتك محفوظة لعائلتك وحدها، ويمكنك حذفها في أي لحظة.</p>
        </div>
      </main>

      {picked && (
        <ReadyStorySheet
          story={picked}
          onClose={() => setPicked(null)}
          onUse={(t, body) => { setTitle(t); setText(body); setPicked(null); }}
        />
      )}
    </>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ReviewContent />
    </Suspense>
  );
}
