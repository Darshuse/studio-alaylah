import LegalPage, { SUPPORT_EMAIL } from "@/components/LegalPage";

export const metadata = { title: "سياسة الخصوصية | Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      titleAr="سياسة الخصوصية" titleEn="Privacy Policy" updated="2026-09-25"
      sections={[
        { ar: "ما نجمعه", en: "What we collect",
          bodyAr: "بريدك واسمك، والنصوص التي تكتبها، وصور الأطفال التي ترفعها، وتسجيل صوتك لاستنساخه، وسجل الدفع (دون بيانات البطاقة).",
          bodyEn: "Your email and name, the story text you write, the photos you upload, your voice recording (used to create your voice clone), and payment records (never card details)." },
        { ar: "كيف نستخدمها", en: "How we use it",
          bodyAr: "فقط لإنتاج الفيلم والكتاب لعائلتك. لا نبيع بياناتك ولا نستخدم صورك أو صوتك لتدريب نماذج ذكاء اصطناعي.",
          bodyEn: "Only to produce the film and book for your family. We do not sell your data, and we do not use your photos or voice to train AI models." },
        { ar: "مزوّدو الخدمة", en: "Service providers",
          bodyAr: "لإتمام الخدمة نرسل البيانات اللازمة فقط إلى مزوّدين: توليد الصور (Together AI)، واستنساخ الصوت (ElevenLabs)، والدفع (Lemon Squeezy)، والاستضافة (Railway).",
          bodyEn: "To deliver the service we send only the data needed to providers: image generation (Together AI), voice cloning (ElevenLabs), payments (Lemon Squeezy) and hosting (Railway)." },
        { ar: "حقوقك", en: "Your rights",
          bodyAr: `يمكنك طلب حذف حسابك وجميع صورك وتسجيلاتك وقصصك في أي وقت بمراسلتنا على ${SUPPORT_EMAIL}.`,
          bodyEn: `You can ask us to delete your account and all your photos, recordings and stories at any time by emailing ${SUPPORT_EMAIL}.` },
        { ar: "الأطفال", en: "Children",
          bodyAr: "الخدمة موجّهة للآباء والأمهات، وهم من يرفعون صور أطفالهم ويتحكمون بها. لا نسمح للأطفال بإنشاء حسابات.",
          bodyEn: "The service is for parents and guardians, who upload and control their children's photos. Children may not create accounts." },
      ]}
    />
  );
}
