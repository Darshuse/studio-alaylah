"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import { api, getToken, type Catalog, type Payment, type Sku } from "@/lib/api";

const STATUS: Record<string, { text: string; cls: string }> = {
  pending: { text: "قيد المراجعة", cls: "bg-[#FFF3D6] text-[#8A5A00]" },
  paid: { text: "تم التفعيل", cls: "bg-primary-fixed/60 text-primary" },
  rejected: { text: "لم يُقبل", cls: "bg-error-container/60 text-error" },
};

function isEgyptGuess() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone === "Africa/Cairo"; } catch { return false; }
}
const money = (s: Sku) => (s.currency === "EGP" ? `${s.amount} جنيه` : `$${s.amount.toFixed(2)}`);

function PayContent() {
  const router = useRouter();
  const done = useSearchParams().get("done") === "1";
  const [cat, setCat] = useState<Catalog | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [pays, setPays] = useState<Payment[]>([]);
  const [egypt, setEgypt] = useState(isEgyptGuess());
  const [sel, setSel] = useState<Sku | null>(null);
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = () => {
    api.catalog().then(setCat).catch(() => setErr("تعذّر تحميل الباقات."));
    if (getToken()) {
      api.entitlement().then((e) => setCredits(e.storyCredits)).catch(() => {});
      api.myPayments().then(setPays).catch(() => {});
    }
  };
  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    load();
    // بعد الرجوع من صفحة الدفع: نعيد التحقق عدة مرات لحين وصول الـwebhook
    if (done) { const t = [2000, 5000, 10000].map((ms) => setTimeout(load, ms)); return () => t.forEach(clearTimeout); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = (cat?.items || []).filter((s) => (egypt ? s.provider === "instapay" : s.provider !== "instapay"));
  const pick = (s: Sku) => { setSel(s); setErr(null); setSent(false); setRef(""); };

  const copy = async () => {
    try { await navigator.clipboard.writeText(cat!.instapayHandle); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };
  const submitInstapay = async () => {
    if (!sel) return;
    setBusy(true); setErr(null);
    try { await api.payInstapay(sel.id, ref.trim()); setSent(true); setSel(null); load(); }
    catch (e) { setErr(e instanceof Error ? e.message : "تعذّر الإرسال"); }
    finally { setBusy(false); }
  };
  const goCheckout = async () => {
    if (!sel) return;
    setBusy(true); setErr(null);
    try { const r = await api.checkout(sel.id); window.location.href = r.url; }
    catch (e) { setErr(e instanceof Error ? e.message : "تعذّر فتح صفحة الدفع"); setBusy(false); }
  };

  const unavailable = cat && (egypt ? !cat.instapayReady : !cat.cardsReady);

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 px-margin flex items-center gap-space-sm">
          <button onClick={() => router.push("/")} aria-label="رجوع" className="w-11 h-11 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-low"><Icon name="arrow_forward" size={24} /></button>
          <h1 className="text-[17px] font-semibold text-primary">شحن الرصيد</h1>
          {credits !== null && <span className="ms-auto text-[12px] font-semibold text-primary bg-surface-container-high px-3 py-1 rounded-full">{credits} قصة متاحة</span>}
        </div>
      </header>

      <main className="flex flex-col w-full px-margin pt-space-md pb-10 gap-4">
        {done && <p className="text-[13px] text-primary bg-primary-fixed/50 rounded-lg px-3 py-2 flex items-center gap-1.5"><Icon name="check_circle" size={16} />استلمنا دفعتك — يُضاف الرصيد خلال لحظات.</p>}
        {sent && <p className="text-[13px] text-primary bg-primary-fixed/50 rounded-lg px-3 py-2">استلمنا رقم العملية. نراجعها ونضيف الرصيد <b>خلال ساعة</b> تقريبًا، وستجدها في «طلباتك» بالأسفل.</p>}

        <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-surface-container-low">
          {[{ v: true, t: "داخل مصر" }, { v: false, t: "خارج مصر" }].map((o) => (
            <button key={o.t} onClick={() => { setEgypt(o.v); setSel(null); setErr(null); }}
              className={"h-11 rounded-full text-[14px] font-semibold " + (egypt === o.v ? "bg-primary-container text-on-primary shadow" : "text-on-surface-variant")}>{o.t}</button>
          ))}
        </div>

        {unavailable ? (
          <div className="bg-surface-container-low rounded-xl p-space-md text-[14px] text-on-surface-variant leading-relaxed">
            {egypt ? "الدفع بانستاباي يُفعَّل قريبًا." : "الدفع بالبطاقة يُفعَّل قريبًا."} سنُبلغك فور جاهزيته.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map((s) => (
              <button key={s.id} onClick={() => pick(s)}
                className={"w-full text-right rounded-xl p-4 flex items-center justify-between border-2 active:scale-[0.99] " + (sel?.id === s.id ? "border-primary bg-primary-fixed/30" : "border-transparent bg-surface-container-lowest shadow-sm")}>
                <div><div className="text-[16px] font-semibold text-primary">{s.label}</div><div className="text-[12px] text-on-surface-variant mt-0.5">{s.credits} {s.credits === 1 ? "حكاية" : "حكايات"} بفيلم وكتاب</div></div>
                <div className="text-[18px] font-extrabold text-primary">{money(s)}</div>
              </button>
            ))}
          </div>
        )}

        {sel && egypt && cat && (
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <p className="text-[14px] text-primary">1. حوّل <b>{money(sel)}</b> عبر انستاباي إلى:</p>
            <button onClick={copy} className="h-12 rounded-xl bg-surface-container-low flex items-center justify-between px-4 text-[16px] font-bold text-primary" dir="ltr">
              <span>{cat.instapayHandle}</span><span className="flex items-center gap-1 text-[12px] font-semibold text-secondary"><Icon name={copied ? "check" : "content_copy"} size={16} />{copied ? "تم النسخ" : "نسخ"}</span>
            </button>
            {cat.instapayName && <p className="text-[12px] text-on-surface-variant -mt-1">باسم: {cat.instapayName}</p>}
            <p className="text-[14px] text-primary">2. الصق <b>رقم العملية</b> من إيصال التحويل:</p>
            <input value={ref} onChange={(e) => setRef(e.target.value)} dir="ltr" placeholder="مثال: 4839201765"
              className="h-12 rounded-xl bg-surface-container-low px-4 text-[16px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            {err && <p className="text-[13px] text-error">{err}</p>}
            <button disabled={busy || ref.trim().length < 6} onClick={submitInstapay}
              className="h-[52px] rounded-full bg-primary-container text-on-primary text-[16px] font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] disabled:opacity-50">
              <Icon name={busy ? "progress_activity" : "send"} size={18} className={busy ? "animate-spin" : ""} /><span>{busy ? "جارٍ الإرسال..." : "أرسلت التحويل"}</span>
            </button>
            <p className="text-[11px] text-on-surface-variant text-center">يُضاف الرصيد بعد مطابقة الإيصال، عادةً خلال ساعة.</p>
          </div>
        )}

        {sel && !egypt && (
          <div className="flex flex-col gap-2">
            {err && <p className="text-[13px] text-error">{err}</p>}
            <button disabled={busy} onClick={goCheckout}
              className="h-[52px] rounded-full bg-primary-container text-on-primary text-[16px] font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] disabled:opacity-50">
              <Icon name={busy ? "progress_activity" : "lock"} size={18} className={busy ? "animate-spin" : ""} /><span>{busy ? "جارٍ الفتح..." : `ادفع ${money(sel)} بأمان`}</span>
            </button>
            <p className="text-[11px] text-on-surface-variant text-center">دفع آمن بالبطاقة عبر Lemon Squeezy — لا نحتفظ ببيانات بطاقتك. يُضاف الرصيد فور الدفع.</p>
          </div>
        )}

        {pays.length > 0 && (
          <section className="flex flex-col gap-2 mt-2">
            <h2 className="text-[14px] font-bold text-primary">طلباتك</h2>
            {pays.slice(0, 6).map((p) => {
              const st = STATUS[p.status] || STATUS.pending;
              return (
                <div key={p.id} className="flex items-center justify-between bg-surface-container-low rounded-lg px-3 py-2.5">
                  <span className="text-[13px] text-primary">{p.credits} {p.credits === 1 ? "حكاية" : "حكايات"} · {p.currency === "EGP" ? p.amount + " جنيه" : "$" + p.amount.toFixed(2)}</span>
                  <span className={"text-[12px] font-semibold px-2.5 py-0.5 rounded-full " + st.cls}>{st.text}</span>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </>
  );
}

export default function PayPage() {
  return <Suspense fallback={<div className="min-h-screen" />}><PayContent /></Suspense>;
}
