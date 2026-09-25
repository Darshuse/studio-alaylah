import LegalPage, { SUPPORT_EMAIL } from "@/components/LegalPage";

export const metadata = { title: "الشروط والأحكام | Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      titleAr="الشروط والأحكام" titleEn="Terms of Service" updated="2026-09-25"
      sections={[
        { ar: "الخدمة", en: "The service",
          bodyAr: "استوديو حكايات العائلة خدمة رقمية عبر الويب تحوّل قصة يكتبها المستخدم إلى فيلم متحرك وكتاب مصوّر، بصوت المستخدم المستنسَخ بموافقته.",
          bodyEn: "Family Tales Studio is an online digital service that turns a story written by the user into an animated film and an illustrated book, narrated in the user's own cloned voice, created with their consent." },
        { ar: "الحساب والرصيد", en: "Account and credits",
          bodyAr: "تُشترى باقات رصيد مسبقة الدفع؛ يستهلك كل رصيد قصة واحدة كاملة (فيلم + كتاب). لا اشتراك ولا تجديد تلقائي، ولا تنتهي صلاحية الرصيد.",
          bodyEn: "Customers buy prepaid credit packs. One credit produces one complete story (film and book). There is no subscription and no automatic renewal, and credits do not expire." },
        { ar: "المحتوى والصوت والصور", en: "Content, voice and photos",
          bodyAr: "يقرّ المستخدم بأنه يملك حق استخدام النصوص والصور والتسجيلات التي يرفعها، وأن الصوت المُسجَّل صوته هو أو صوت شخص وافق صراحةً. يُمنع رفع صور أو أصوات أشخاص دون إذنهم أو محتوى مسيء أو غير قانوني. نحتفظ بحق رفض أو حذف المحتوى المخالف.",
          bodyEn: "You confirm that you have the right to use the text, photos and recordings you upload, and that any recorded voice is your own or belongs to a person who explicitly agreed. You must not upload other people's photos or voices without permission, or any abusive or illegal content. We may refuse or remove content that breaks these rules." },
        { ar: "ملكية المخرجات", en: "Ownership of results",
          bodyAr: "الأفلام والكتب الناتجة لك للاستخدام الشخصي والعائلي. نتائج الذكاء الاصطناعي قد تختلف عن التوقعات وقد تحتوي أخطاء بسيطة في الرسوم.",
          bodyEn: "The films and books produced are yours for personal and family use. AI output can differ from expectations and may contain minor visual imperfections." },
        { ar: "الدفع", en: "Payments",
          bodyAr: "الدفع بالبطاقة يتم عبر Lemon Squeezy (تاجر السجل)، ولا نحتفظ ببيانات بطاقتك. في مصر يتوفر التحويل عبر انستاباي ويُضاف الرصيد بعد مطابقة الإيصال.",
          bodyEn: "Card payments are processed by Lemon Squeezy, our Merchant of Record; we never store your card details. In Egypt, InstaPay transfers are also available and credits are added after the receipt is verified." },
        { ar: "حدود المسؤولية", en: "Limitation of liability",
          bodyAr: "تُقدَّم الخدمة «كما هي». لا نتحمل مسؤولية أي خسارة غير مباشرة، ويقتصر أي تعويض على قيمة ما دفعته عن الرصيد المعني.",
          bodyEn: "The service is provided \"as is\". We are not liable for indirect losses, and any liability is limited to the amount you paid for the affected credits." },
        { ar: "التواصل", en: "Contact",
          bodyAr: `لأي استفسار: ${SUPPORT_EMAIL}`,
          bodyEn: `For any question: ${SUPPORT_EMAIL}` },
      ]}
    />
  );
}
