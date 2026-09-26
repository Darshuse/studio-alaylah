import Link from "next/link";
import { SUPPORT_EMAIL } from "@/components/LegalPage";

export const metadata = {
  title: "من نحن | About — حكايات العائلة",
  description: "حكايات العائلة: اكتب حكايتك بصوتك، ونحوّلها إلى فيلم كرتوني وكتاب مصوّر بطله طفلك.",
};

const STEPS = [
  { n: "1", t: "اكتب الحكاية", d: "اكتب موقفًا طريفًا أو ذكرى دافئة، أو اختر حكاية جاهزة بضغطة واحدة." },
  { n: "2", t: "اقرأها بصوتك", d: "تقرأ النص بصوتك مرة واحدة (نحو نصف دقيقة)، فنستنسخ صوتك ليحكي الفيلم بنبرتك." },
  { n: "3", t: "أضف بطلك", d: "ارفع صورة طفلك فنحوّلها إلى شخصية كرتونية تظهر في كل المشاهد." },
  { n: "4", t: "استلم فيلمك وكتابك", d: "نُنتج مشاهد مرسومة وفيلمًا متحركًا بصوتك، وكتابًا مصوّرًا قابلًا للتحميل." },
];

export default function AboutPage() {
  return (
    <main className="w-full max-w-2xl mx-auto px-margin py-space-md pb-16 flex flex-col gap-5">
      <header className="text-center flex flex-col items-center gap-3 pt-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="حكايات العائلة" className="w-24 h-24 rounded-2xl object-cover shadow-md" />
        <h1 className="text-[26px] leading-[38px] font-extrabold text-primary">اكتب حكايتك… وبصوتك نصنع فيلمها</h1>
        <p className="text-[15px] text-on-surface-variant leading-relaxed">
          حكايات العائلة خدمة عبر الويب تحوّل قصة يكتبها الأب أو الأم إلى فيلم كرتوني وكتاب مصوّر، بطله طفلك وراويه أنت.
        </p>
        <Link href="/login?mode=register" className="h-[52px] px-8 rounded-full bg-secondary text-on-secondary text-[16px] font-semibold flex items-center shadow-md">
          ابدأ بأول حكاية هدية 🎁
        </Link>
      </header>

      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2">
        <h2 className="text-[18px] font-bold text-primary">من نحن</h2>
        <p className="text-[14px] text-on-surface leading-relaxed">
          فريق صغير يبني أداة بسيطة تُبقي صوت الأب والأم حاضرًا في حكايات أطفالهم، حتى حين يكونون مسافرين أو مشغولين. نخدم العائلات العربية في مصر والسعودية والخليج وفي المهجر.
        </p>
        <p className="text-[13px] text-on-surface-variant leading-relaxed" dir="ltr">
          Family Tales Studio is a small team building a simple tool that keeps a parent&apos;s voice present in their children&apos;s stories, even when they are away. We serve Arabic-speaking families in Egypt, Saudi Arabia, the Gulf and abroad.
        </p>
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[18px] font-bold text-primary">كيف تستخدمنا؟</h2>
        {STEPS.map((s) => (
          <div key={s.n} className="flex gap-3 bg-surface-container-lowest rounded-xl p-4 shadow-sm">
            <span className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold shrink-0">{s.n}</span>
            <div><div className="text-[15px] font-semibold text-primary">{s.t}</div><div className="text-[13px] text-on-surface-variant mt-0.5 leading-relaxed">{s.d}</div></div>
          </div>
        ))}
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2">
        <h2 className="text-[18px] font-bold text-primary">الأسعار</h2>
        <p className="text-[14px] text-on-surface leading-relaxed">أول حكاية هدية. بعدها تشتري رصيدًا مسبق الدفع، وكل رصيد = حكاية كاملة (فيلم + كتاب). لا اشتراك ولا تجديد تلقائي.</p>
        <p className="text-[13px] text-on-surface-variant">في مصر: 100 جنيه للحكاية، أو 299 جنيه لـ5 حكايات (انستاباي). دوليًا: قريبًا بالبطاقة.</p>
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2">
        <h2 className="text-[18px] font-bold text-primary">خصوصيتكم أمانة</h2>
        <p className="text-[14px] text-on-surface leading-relaxed">صور أطفالك وتسجيل صوتك خاصة بحسابك وحده، نستخدمها فقط لإنتاج حكايتك، ولا نستخدمها لتدريب نماذج ذكاء اصطناعي، ويمكنك طلب حذفها في أي وقت.</p>
      </section>

      <p className="text-[12px] text-on-surface-variant text-center">
        <Link href="/terms">الشروط / Terms</Link> · <Link href="/refunds">الاسترداد / Refunds</Link> · <Link href="/privacy-policy">الخصوصية / Privacy</Link>
        <br />{SUPPORT_EMAIL}
      </p>
    </main>
  );
}
