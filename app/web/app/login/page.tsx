"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { api, setSession } from "@/lib/api";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { google?: any } }

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  // الرابط /login?mode=register يفتح التسجيل مباشرة (للإعلانات ومنشورات الصفحة)
  useEffect(() => { if (new URLSearchParams(window.location.search).get("mode") === "register") setMode("register"); }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const gbtn = useRef<HTMLDivElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const res = mode === "register"
        ? await api.register({ email, password, displayName: name || undefined })
        : await api.login({ email, password });
      setSession(res.token, res.familyId, res.displayName);
      router.push("/");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "تعذّر إتمام العملية");
    } finally { setBusy(false); }
  };

  // تسجيل الدخول بجوجل (Google Identity Services): نأخذ ID Token ونرسله للباك
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const onCredential = async (resp: { credential?: string }) => {
      if (!resp.credential) return;
      setErr(null); setBusy(true);
      try {
        const res = await api.googleLogin(resp.credential);
        setSession(res.token, res.familyId, res.displayName);
        router.push("/");
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "تعذّر الدخول بجوجل");
      } finally { setBusy(false); }
    };
    const render = () => {
      if (!window.google || !gbtn.current) return;
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onCredential });
      window.google.accounts.id.renderButton(gbtn.current, {
        theme: "outline", size: "large", shape: "pill", text: "continue_with", width: 320, locale: "ar",
      });
    };
    if (window.google) { render(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true; s.onload = render;
    document.head.appendChild(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen flex flex-col justify-center px-margin py-space-xl gap-space-lg">
      <div className="flex flex-col items-center text-center gap-space-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="حكايات العائلة" className="w-28 h-28 rounded-2xl object-contain shadow-md" />
        <h1 className="text-[26px] leading-[38px] font-bold text-primary mt-2">استوديو حكايات العائلة</h1>
        <p className="text-[15px] text-on-surface-variant">{mode === "register" ? "أنشئ حسابك لتبدأ توثيق ذكرياتك" : "أهلاً بعودتك، سجّل الدخول"}</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-space-sm">
        {mode === "register" && (
          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-on-surface-variant">الاسم</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="أبو عمر"
              className="h-12 rounded-xl bg-surface-container-low px-4 text-[15px] text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-on-surface-variant">البريد الإلكتروني</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" dir="ltr"
            className="h-12 rounded-xl bg-surface-container-low px-4 text-[15px] text-on-surface text-right focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-on-surface-variant">كلمة المرور</span>
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="٨ أحرف على الأقل"
            className="h-12 rounded-xl bg-surface-container-low px-4 text-[15px] text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </label>

        {err && <p className="text-[13px] text-error bg-error-container/50 rounded-lg px-3 py-2">{err}</p>}

        <button type="submit" disabled={busy}
          className="mt-2 h-[52px] rounded-full bg-primary-container text-on-primary text-[17px] font-semibold flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(27,59,54,0.18)] active:scale-[0.98] disabled:opacity-60">
          {busy ? <Icon name="progress_activity" size={22} className="animate-spin" /> : <Icon name={mode === "register" ? "person_add" : "login"} size={22} />}
          <span>{busy ? "لحظة..." : mode === "register" ? "إنشاء الحساب" : "تسجيل الدخول"}</span>
        </button>
      </form>

      {GOOGLE_CLIENT_ID && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 w-full">
            <span className="h-px flex-1 bg-outline-variant/60" />
            <span className="text-[12px] text-on-surface-variant">أو</span>
            <span className="h-px flex-1 bg-outline-variant/60" />
          </div>
          <div ref={gbtn} className="flex justify-center min-h-[44px]" />
        </div>
      )}

      <button onClick={() => { setErr(null); setMode(mode === "register" ? "login" : "register"); }}
        className="text-[14px] text-secondary font-medium text-center">
        {mode === "register" ? "لديك حساب؟ سجّل الدخول" : "ليس لديك حساب؟ أنشئ واحداً"}
      </button>
      <p className="text-[11px] text-on-surface-variant text-center mt-4">
        من نحن؟ <a href="/about" className="underline">تعرّف علينا</a> · بالمتابعة توافق على <a href="/terms" className="underline">الشروط</a> و<a href="/privacy-policy" className="underline">الخصوصية</a>
      </p>
    </main>
  );
}
