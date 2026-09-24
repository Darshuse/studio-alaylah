"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import RecordSheet from "@/components/RecordSheet";
import { api, getToken, uploadChildPhoto, enrollParentVoice, type Character } from "@/lib/api";

function CharactersContent() {
  const router = useRouter();
  const id = useSearchParams().get("id");

  const [chars, setChars] = useState<Character[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState<string | null>(null);
  const [avatarErr, setAvatarErr] = useState<string | null>(null);
  const [voiceForId, setVoiceForId] = useState<string | null>(null); // البطاقة اللي بنسجّل صوتها
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceErr, setVoiceErr] = useState<string | null>(null);

  const onPhoto = async (cid: string, file: File) => {
    setAvatarBusy(cid); setAvatarErr(null);
    try { await uploadChildPhoto(cid, file); load(); }
    catch (e) { setAvatarErr(e instanceof Error ? e.message : "تعذّر تحويل الصورة"); }
    finally { setAvatarBusy(null); }
  };

  const onVoice = async (blob: Blob) => {
    if (!voiceForId) return;
    setVoiceBusy(true); setVoiceErr(null);
    try { await enrollParentVoice(voiceForId, blob); setVoiceForId(null); load(); }
    catch (e) { setVoiceErr(e instanceof Error ? e.message : "تعذّر استنساخ الصوت"); }
    finally { setVoiceBusy(false); }
  };

  const load = () => {
    if (!getToken()) { setChars([]); return; }
    api.listCharacters().then(setChars).catch(() => setChars([]));
  };
  useEffect(load, []);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true); setErr(null);
    try {
      await api.createCharacter({ displayName: name.trim(), ageLabel: age.trim() || undefined });
      setName(""); setAge(""); setAdding(false); load();
    } catch { setErr("تعذّر إضافة الفرد."); }
    finally { setBusy(false); }
  };

  const remove = async (cid: string) => {
    try { await api.deleteCharacter(cid); load(); } catch {}
  };

  const next = () => router.push("/art-style" + (id ? "?id=" + id : ""));
  // بطاقة «الراوي» (صوت الأب) تُدار من خطوة الصوت — لا تظهر كبطل للحكاية
  const heroes = chars ? chars.filter((c) => c.ageLabel !== "الراوي") : null;

  return (
    <>
      <AppHeader tab="شخصياتنا" icon="diversity_1" />
      <main className="flex flex-col w-full px-margin pt-space-md pb-28 flex-grow">
        <section className="flex flex-col gap-space-xs mb-space-md">
          <div className="inline-flex items-center gap-1.5 self-start px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed">
            <Icon name="family_restroom" size={16} fill /><span className="text-[12px] font-semibold">أبطال الحكاية</span>
          </div>
          <h2 className="text-[22px] leading-[32px] font-semibold text-primary tracking-tight">من هم أبطال هذه الذكرى؟</h2>
          <p className="text-[13px] text-on-surface-variant leading-relaxed">أضف أفراد عائلتك ليكونوا أبطال القصة برسم هادئ يحفظ خصوصيتهم.</p>
        </section>

        {/* Real characters */}
        <div className="grid grid-cols-1 gap-space-sm mb-space-md">
          {chars === null && (
            <div className="py-10 flex justify-center text-on-surface-variant"><Icon name="progress_activity" size={28} className="animate-spin" /></div>
          )}
          {heroes && heroes.length === 0 && !adding && (
            <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col items-center text-center gap-2">
              <Icon name="group_add" size={40} className="text-outline-variant" />
              <p className="text-[14px] text-on-surface-variant">لم تُضِف أي بطل بعد. ابدأ بإضافة فرد من عائلتك.</p>
            </div>
          )}
          {heroes && heroes.map((c) => (
            <article key={c.id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-primary-container flex items-center justify-center text-secondary-container shrink-0">
                    {c.avatarUrl
                      ? <img src={c.avatarUrl} alt={c.displayName} className="w-full h-full object-cover" />
                      : <span className="text-[20px] font-bold">{c.displayName.slice(0, 1)}</span>}
                    {avatarBusy === c.id && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Icon name="progress_activity" size={22} className="animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[17px] text-primary font-semibold truncate">{c.displayName}</h3>
                      {c.ageLabel && <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[12px]">{c.ageLabel}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant mt-0.5">
                      <Icon name={c.identityReady ? "verified" : "hourglass_empty"} size={15} className={c.identityReady ? "text-primary" : ""} />
                      <span className="text-[12px]">{c.identityReady ? "شخصيته الكرتونية جاهزة" : "أضف صورته ليصبح بطل الحكاية"}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => remove(c.id)} aria-label="حذف" className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-error shrink-0"><Icon name="delete" size={18} /></button>
              </div>
              <div className="flex gap-2">
                <label className={"flex-1 py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-center gap-2 text-primary text-[13px] font-semibold cursor-pointer active:scale-[0.98] " + (avatarBusy ? "opacity-50 pointer-events-none" : "")}>
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(c.id, f); e.currentTarget.value = ""; }} />
                  <Icon name={avatarBusy === c.id ? "progress_activity" : (c.avatarUrl ? "cached" : "add_a_photo")} size={17} className={avatarBusy === c.id ? "animate-spin" : ""} />
                  <span>{avatarBusy === c.id ? "جارٍ التحويل..." : c.avatarUrl ? "تغيير الصورة" : "صورة → شخصية"}</span>
                </label>
                <button onClick={() => { setVoiceErr(null); setVoiceForId(c.id); }}
                  className={"flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-[13px] font-semibold active:scale-[0.98] " + (c.voiceReady ? "bg-primary-container text-on-primary" : "bg-surface-container-low hover:bg-surface-container text-primary")}>
                  <Icon name={c.voiceReady ? "graphic_eq" : "mic"} size={17} />
                  <span>{c.voiceReady ? "صوته جاهز" : "سجّل صوته"}</span>
                </button>
              </div>
            </article>
          ))}
          {avatarErr && <p className="text-[13px] text-error px-1">{avatarErr}</p>}
          {voiceErr && <p className="text-[13px] text-error px-1">{voiceErr}</p>}
        </div>

        {/* Add form / trigger */}
        {adding ? (
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm mb-space-lg">
            <h3 className="text-[15px] font-semibold text-primary">إضافة فرد من العائلة</h3>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم (مثلًا: براء)" className="h-12 rounded-xl bg-surface-container-low px-4 text-[15px] text-primary focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30 text-right" />
            <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="العمر أو الوصف (اختياري — مثلًا: ٧ سنوات)" className="h-12 rounded-xl bg-surface-container-low px-4 text-[15px] text-primary focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30 text-right" />
            {err && <p className="text-[13px] text-error">{err}</p>}
            <div className="flex gap-2.5">
              <button disabled={busy || !name.trim()} onClick={add} className="flex-1 h-11 rounded-full bg-primary-container text-on-primary text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                <Icon name={busy ? "progress_activity" : "person_add"} size={18} className={busy ? "animate-spin" : ""} /><span>{busy ? "جارٍ الإضافة..." : "إضافة"}</span>
              </button>
              <button disabled={busy} onClick={() => { setAdding(false); setErr(null); }} className="px-5 h-11 rounded-full bg-surface-container text-primary text-[14px] font-medium">إلغاء</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="w-full py-3.5 px-space-md rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-center gap-2 text-primary text-[14px] font-semibold mb-space-lg active:scale-[0.98]">
            <div className="w-7 h-7 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow"><Icon name="person_add" size={18} /></div>
            <span>+ إضافة فرد من العائلة إلى القصة</span>
          </button>
        )}

        <div className="flex flex-col gap-space-xs">
          <button onClick={next} className="w-full h-[52px] rounded-full bg-primary-container text-on-primary text-[14px] font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-primary active:scale-[0.98]"><span>متابعة لاختيار طابع المشاهد</span><Icon name="arrow_back" size={20} className="rotate-180" /></button>
          <p className="text-center text-[12px] text-on-surface-variant mt-1">يمكنك تعديل أو حذف أي بطل في أي وقت.</p>
        </div>
      </main>
      {voiceForId && (
        <RecordSheet
          busy={voiceBusy}
          onClose={() => { if (!voiceBusy) setVoiceForId(null); }}
          onDone={onVoice}
          onSkip={() => { if (!voiceBusy) setVoiceForId(null); }}
        />
      )}
      <BottomNav />
    </>
  );
}

export default function CharactersPage() {
  return <Suspense fallback={<div className="min-h-screen" />}><CharactersContent /></Suspense>;
}
