import Link from "next/link";
import { SUPPORT_EMAIL } from "@/components/LegalPage";

export const metadata = {
  title: "من نحن | About — حكايات العائلة",
  description: "اكتب قصتك الخاصة، ونحوّلها إلى فيلم وكتاب مصوّر بصوتك. طفلك وعائلتك هم الأبطال، وصوتك ذكرى تبقى للأبناء والأحفاد.",
};

const VALUES = [
  { i: "🎙️", t: "صوتك ذكرى تبقى", d: "صوتك يحكي لطفلك كل ليلة، وسيبقى لأحفادك يسمعون به جدّهم وأباهم بعد سنوات." },
  { i: "🌱", t: "قيمك… بحكايتك أنت", d: "ليست قصة جاهزة مفروضة عليك. اكتب موقفك الخاص، وعلّم طفلك الصدق والصبر والعطاء بشكل غير مباشر، من خلال بطل يشبهه." },
  { i: "🌍", t: "لغتك وهويتك في الغربة", d: "للأسرة العربية في الخارج: طفلك يسمع العربية بصوت أبيه وبلهجة أهله، فتبقى لغته وهويته حيّتين في البيت." },
  { i: "📖", t: "فيديو وكتاب مصوّر", d: "كل حكاية فيلم متحرك وكتاب يُحفظ. أنت وطفلك وعائلتك أبطالها، وتكبر المكتبة مع طفلك." },
];

const STEPS = [
  { t: "اكتب قصتك", d: "موقف من يومكم، أو ذكرى، أو قيمة تريد أن يتعلمها طفلك. أو اختر حكاية جاهزة بضغطة." },
  { t: "اقرأها بصوتك", d: "تقرأ النص مرة واحدة (نحو نصف دقيقة)، فنستنسخ صوتك ليحكي الفيلم بنبرتك." },
  { t: "أضف الأبطال", d: "ارفع صورة طفلك وأفراد العائلة، فيتحوّلون إلى شخصيات كرتونية تظهر في كل مشهد." },
  { t: "استلم فيلمك وكتابك", d: "نُنتج المشاهد والفيلم بصوتك، وكتابًا مصوّرًا تحمّله وتحتفظ به." },
  { t: "كرّر كل ليلة", d: "حكاية جديدة كلما أردت، ومع كل حكاية ذكرى جديدة بصوتك." },
];

export default function AboutPage() {
  return (
    <main className="w-full max-w-2xl mx-auto px-margin py-space-md pb-16 flex flex-col gap-6">
      <header className="text-center flex flex-col items-center gap-3 pt-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="حكايات العائلة" className="w-24 h-24 rounded-2xl object-cover shadow-md" />
        <h1 className="text-[27px] leading-[40px] font-extrabold text-primary text-balance">طفلك بطل الحكاية… وأنت الراوي</h1>
        <p className="text-[16px] text-on-surface-variant leading-relaxed">
          اكتب قصتك الخاصة، ونحوّلها إلى <b className="text-primary">فيلم وكتاب مصوّر</b> يحكيها <b className="text-primary">بصوتك</b>. أبطالها أنت وطفلك وعائلتك.
        </p>
        <Link href="/login?mode=register" className="h-[52px] px-8 rounded-full bg-secondary text-on-secondary text-[16px] font-semibold flex items-center shadow-md">
          ابدأ بأول حكاية هدية 🎁
        </Link>
      </header>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[19px] font-bold text-primary">لماذا حكايات العائلة؟</h2>
        {VALUES.map((v) => (
          <div key={v.t} className="flex gap-3 bg-surface-container-lowest rounded-xl p-4 shadow-sm">
            <span className="text-[26px] leading-none shrink-0" aria-hidden>{v.i}</span>
            <div>
              <div className="text-[16px] font-semibold text-primary">{v.t}</div>
              <div className="text-[13.5px] text-on-surface-variant mt-1 leading-relaxed">{v.d}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[19px] font-bold text-primary">كيف تبدأ؟</h2>
        {STEPS.map((s, i) => (
          <div key={s.t} className="flex gap-3 bg-surface-container-lowest rounded-xl p-4 shadow-sm">
            <span className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold shrink-0">{i + 1}</span>
            <div>
              <div className="text-[15px] font-semibold text-primary">{s.t}</div>
              <div className="text-[13px] text-on-surface-variant mt-0.5 leading-relaxed">{s.d}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2">
        <h2 className="text-[17px] font-bold text-primary">من نحن</h2>
        <p className="text-[14px] text-on-surface leading-relaxed">
          فريق صغير يؤمن أن أقوى حكاية يسمعها الطفل هي التي يرويها أبوه أو أمه. نخدم العائلات العربية في مصر والسعودية والخليج وفي المهجر.
        </p>
        <p className="text-[12.5px] text-on-surface-variant leading-relaxed" dir="ltr">
          Family Tales Studio turns a parent&apos;s own story into an animated film and illustrated book, narrated in the parent&apos;s cloned voice, starring the child and the family. A keepsake for children and grandchildren, and a way for Arab families abroad to keep their language and identity alive.
        </p>
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2">
        <h2 className="text-[17px] font-bold text-primary">الأسعار</h2>
        <p className="text-[14px] text-on-surface leading-relaxed">أول حكاية هدية. بعدها رصيد مسبق الدفع، وكل رصيد = حكاية كاملة (فيلم + كتاب). لا اشتراك ولا تجديد تلقائي.</p>
        <p className="text-[13px] text-on-surface-variant">في مصر: 100 جنيه للحكاية، أو 299 جنيه لـ5 حكايات (انستاباي). الدفع بالبطاقة للمقيمين خارج مصر قريبًا.</p>
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2">
        <h2 className="text-[17px] font-bold text-primary">خصوصيتكم أمانة</h2>
        <p className="text-[14px] text-on-surface leading-relaxed">صور أطفالك وتسجيل صوتك خاصة بحسابك وحده، نستخدمها فقط لإنتاج حكايتك، ولا نستخدمها لتدريب نماذج ذكاء اصطناعي، ويمكنك طلب حذفها في أي وقت.</p>
      </section>

      <div className="text-center">
        <Link href="/login?mode=register" className="inline-flex h-[52px] px-8 rounded-full bg-secondary text-on-secondary text-[16px] font-semibold items-center shadow-md">
          اصنع أول حكاية لطفلك الآن
        </Link>
      </div>

      <p className="text-[12px] text-on-surface-variant text-center">
        <Link href="/terms">الشروط / Terms</Link> · <Link href="/refunds">الاسترداد / Refunds</Link> · <Link href="/privacy-policy">الخصوصية / Privacy</Link>
        <br />{SUPPORT_EMAIL}
      </p>
    </main>
  );
}
