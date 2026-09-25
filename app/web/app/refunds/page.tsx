import LegalPage, { SUPPORT_EMAIL } from "@/components/LegalPage";

export const metadata = { title: "سياسة الاسترداد | Refund Policy" };

export default function RefundsPage() {
  return (
    <LegalPage
      titleAr="سياسة الاسترداد" titleEn="Refund Policy" updated="2026-09-25"
      sections={[
        { ar: "رصيد غير مستخدم", en: "Unused credits",
          bodyAr: "يمكنك طلب استرداد كامل لرصيد لم تستخدم أيًّا منه خلال 14 يومًا من الشراء.",
          bodyEn: "You may request a full refund of a credit pack within 14 days of purchase if none of its credits has been used." },
        { ar: "فشل التوليد", en: "Failed generation",
          bodyAr: "إذا فشل توليد قصة لسبب من جانبنا، يُعاد الرصيد المستهلك لحسابك أو يُسترد ثمنه بحسب رغبتك.",
          bodyEn: "If a story fails to generate because of a problem on our side, the credit is restored to your account, or refunded if you prefer." },
        { ar: "رصيد مستخدم", en: "Used credits",
          bodyAr: "الرصيد الذي استُخدم في قصة اكتملت وسُلِّمت غير قابل للاسترداد، إلا إذا كانت النتيجة معيبة بوضوح وأعدنا المحاولة دون تحسّن.",
          bodyEn: "Credits used for a completed and delivered story are non-refundable, unless the result is clearly defective and a retry does not fix it." },
        { ar: "كيف تطلب الاسترداد", en: "How to request a refund",
          bodyAr: `راسلنا على ${SUPPORT_EMAIL} مع بريد حسابك ورقم العملية. نرد خلال 3 أيام عمل. تُردّ المبالغ بنفس وسيلة الدفع الأصلية (بطاقة عبر Lemon Squeezy، أو انستاباي).`,
          bodyEn: `Email ${SUPPORT_EMAIL} with your account email and the order or transfer reference. We reply within 3 business days. Refunds go back to the original payment method (card via Lemon Squeezy, or InstaPay).` },
      ]}
    />
  );
}
