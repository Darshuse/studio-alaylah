"use client";
import { useState } from "react";
import { api, type Payment } from "@/lib/api";

/** موافقة مدفوعات انستاباي (للمالك فقط). التوكن الإداري يبقى في الذاكرة فقط ولا يُحفَظ. */
export default function AdminPayments() {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState<Payment[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    try { setRows(await api.adminPending(token)); } catch (e) { setRows(null); setErr(e instanceof Error ? e.message : "فشل"); }
  };
  const decide = async (id: string, a: "approve" | "reject") => {
    setBusy(id);
    try { await api.adminDecide(token, id, a); await load(); } catch (e) { setErr(e instanceof Error ? e.message : "فشل"); }
    finally { setBusy(null); }
  };

  return (
    <main className="w-full px-margin py-space-md flex flex-col gap-3" dir="rtl">
      <h1 className="text-[20px] font-bold text-primary">مدفوعات انستاباي المعلّقة</h1>
      <div className="flex gap-2">
        <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="التوكن الإداري" dir="ltr"
          className="flex-1 h-11 rounded-xl bg-surface-container-low px-3 text-primary" />
        <button onClick={load} disabled={!token} className="px-5 h-11 rounded-full bg-primary-container text-on-primary font-semibold disabled:opacity-50">عرض</button>
      </div>
      {err && <p className="text-[13px] text-error">{err}</p>}
      {rows && rows.length === 0 && <p className="text-on-surface-variant">لا توجد طلبات معلّقة ✅</p>}
      {rows?.map((p) => (
        <div key={p.id} className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between text-[15px] font-semibold text-primary"><span>{p.amount} جنيه · {p.credits} قصص</span><span dir="ltr">{p.ref}</span></div>
          <div className="text-[12px] text-on-surface-variant" dir="ltr">{p.createdAt}</div>
          <div className="flex gap-2">
            <button disabled={busy === p.id} onClick={() => decide(p.id, "approve")} className="flex-1 h-11 rounded-full bg-primary-container text-on-primary font-semibold">تأكيد الاستلام</button>
            <button disabled={busy === p.id} onClick={() => decide(p.id, "reject")} className="px-5 h-11 rounded-full bg-surface-container text-error font-medium">رفض</button>
          </div>
        </div>
      ))}
    </main>
  );
}
