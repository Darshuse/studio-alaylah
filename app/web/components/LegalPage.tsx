import Link from "next/link";

export type LegalSection = { ar: string; en: string; bodyAr: string; bodyEn: string };

export const SUPPORT_EMAIL = "mostafa.mohamed.aebada94@gmail.com";

/** صفحة قانونية عامة (بدون تسجيل دخول) — عربي + إنجليزي لمراجعي مزوّد الدفع. */
export default function LegalPage({ titleAr, titleEn, updated, sections }: { titleAr: string; titleEn: string; updated: string; sections: LegalSection[] }) {
  return (
    <main className="w-full max-w-2xl mx-auto px-margin py-space-md pb-16 flex flex-col gap-5">
      <Link href="/" className="text-[13px] text-secondary font-semibold">← حكايات العائلة / Family Tales Studio</Link>
      <header>
        <h1 className="text-[24px] font-bold text-primary">{titleAr}</h1>
        <p className="text-[16px] text-on-surface-variant" dir="ltr">{titleEn}</p>
        <p className="text-[12px] text-on-surface-variant mt-1">آخر تحديث / Last updated: {updated}</p>
      </header>
      {sections.map((s) => (
        <section key={s.en} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <h2 className="text-[16px] font-semibold text-primary">{s.ar} <span className="text-on-surface-variant font-normal" dir="ltr">/ {s.en}</span></h2>
          <p className="text-[14px] text-on-surface leading-relaxed">{s.bodyAr}</p>
          <p className="text-[13px] text-on-surface-variant leading-relaxed" dir="ltr">{s.bodyEn}</p>
        </section>
      ))}
      <p className="text-[12px] text-on-surface-variant text-center">
        <Link href="/terms">الشروط / Terms</Link> · <Link href="/refunds">الاسترداد / Refunds</Link> · <Link href="/privacy-policy">الخصوصية / Privacy</Link>
        <br />{SUPPORT_EMAIL}
      </p>
    </main>
  );
}
