"use client";
import { useState } from "react";
import Icon from "@/components/Icon";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${on ? "bg-primary" : "bg-surface-container-highest"}`}>
      <span className={`absolute top-[2px] h-5 w-5 rounded-full bg-white transition-all ${on ? "start-[2px] translate-x-0" : "start-[2px] translate-x-[20px]"}`} />
    </button>
  );
}

export default function PrivacyPage() {
  const [audio, setAudio] = useState<"keep" | "delete">("keep");
  const [blur, setBlur] = useState(true);
  const [family, setFamily] = useState(true);
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <AppHeader tab="الأمان" icon="lock" />
      <main className="flex flex-col w-full px-margin pt-space-md pb-28 flex-grow gap-space-md">
        {/* Shield banner */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low shadow-sm p-space-md">
          <div className="flex items-start gap-space-sm">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 text-on-primary shadow-sm"><Icon name="verified_user" size={26} fill /></div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1"><h2 className="text-[20px] leading-[30px] font-semibold text-primary tracking-tight">خصوصيتكم وأمان عائلتكم أولاً</h2><span className="text-[18px]">🛡️</span></div>
              <p className="text-[15px] text-on-surface-variant leading-relaxed">صوتك الدافئ، وضحكات ووجوه أطفالك أمانة مقدسة؛ صُمم هذا الأرشيف ليكون خزانتكم العائلية الخاصة دون مشاركة أو تدريب لأي نماذج ذكاء اصطناعي عامة.</p>
            </div>
          </div>
          <div className="mt-space-sm flex items-center justify-between bg-surface-container rounded-lg px-space-sm py-space-xs">
            <div className="flex items-center gap-2"><Icon name="enhanced_encryption" size={20} fill className="text-secondary" /><span className="text-[14px] text-on-surface font-medium">تشفير تام خاص بعائلتكم (End-to-End)</span></div>
            <span className="text-[12px] text-secondary font-semibold bg-secondary-fixed/50 px-2 py-0.5 rounded-full">محمي ومغلق</span>
          </div>
        </div>

        {/* Pillar 1: voice */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm">
          <div className="flex items-center gap-space-xs pb-1">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary"><Icon name="mic" size={20} /></div>
            <div className="flex flex-col"><h3 className="text-[17px] font-semibold text-primary">الملفات الصوتية ونبرات الراوي</h3><p className="text-[13px] text-on-surface-variant">التحكم في حفظ أصوات الأجداد والأبوين التذكارية</p></div>
          </div>
          {[
            { id: "keep", t: "الاحتفاظ بالملف الصوتي الأصلي مع الحكاية", d: "يُحفظ التسجيل الصوتي كإرث عائلي مسموع داخل القصة لمشاركتها مع الأجيال القادمة." },
            { id: "delete", t: "حذف التسجيل الصوتي فور توثيق النص والمشاهد", d: "يتم التخلص الفوري والآمن من الصوت الخام بمجرد توليد النص وصفحات الألبوم." },
          ].map((o) => (
            <label key={o.id} onClick={() => setAudio(o.id as "keep" | "delete")} className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container">
              <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${audio === o.id ? "border-primary" : "border-outline"}`}>{audio === o.id && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}</span>
              <div className="flex flex-col flex-1"><span className="text-[14px] text-on-surface font-semibold">{o.t}</span><span className="text-[13px] text-on-surface-variant mt-0.5">{o.d}</span></div>
            </label>
          ))}
        </div>

        {/* Pillar 2: children */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm">
          <div className="flex items-center gap-space-xs pb-1">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary"><Icon name="face_retouching_natural" size={20} /></div>
            <div className="flex flex-col"><h3 className="text-[17px] font-semibold text-primary">صور وملامح الأطفال</h3><p className="text-[13px] text-on-surface-variant">الخصوصية البصرية والمعالجة الفنية المشفرة</p></div>
          </div>
          <div className="flex gap-space-sm p-space-sm rounded-lg bg-surface-container-low items-center">
            <img className="w-16 h-16 rounded-lg object-cover flex-shrink-0 shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDP3em3YRqODsAIYoruwkeoaz7O8UyYzLjc3nl1z95uLVSc-lvjXxMlhRSyqyD0ZdlMyvLdKa5WuTBGUYEI3GxKHI6-W0D7QM0PwhH9D9NGpsAUuaQ4Tzi8VVrBwRmDj8kvw2k8UIltSq3bYSVSPuK_DI83wRsfGCVNnh_qnf4OxTwpzDzHxH4nu89E8C9tMTI6IrUMVYQ6ffsTlOH_C_b5uWxyqpDhjQkJ3oNUEakRVnVhYDkCyBY" alt="تجريد فني" />
            <div className="flex flex-col min-w-0"><span className="text-[14px] text-primary font-semibold">تجريد فني آمن</span><p className="text-[13px] text-on-surface-variant mt-0.5 leading-snug">تحويل الصور يتم بتقنية التجريد الفني المشفر؛ الملامح الدقيقة لا تُخزن في أي خوادم مفتوحة أو مشتركة.</p></div>
          </div>
          <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
            <div className="flex flex-col pr-1 flex-1"><span className="text-[14px] text-on-surface font-semibold">طمس فني إضافي للملامح الدقيقة</span><span className="text-[13px] text-on-surface-variant mt-0.5">تحويل وجوه الأطفال إلى رسوم حالمة دافئة بدون تطابق بيومتري</span></div>
            <Toggle on={blur} onClick={() => setBlur((v) => !v)} />
          </div>
        </div>

        {/* Pillar 3: sharing */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm">
          <div className="flex items-center gap-space-xs pb-1">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary"><Icon name="home_pin" size={20} /></div>
            <div className="flex flex-col"><h3 className="text-[17px] font-semibold text-primary">نطاق مشاركة الحكايات</h3><p className="text-[13px] text-on-surface-variant">تحديد من يمكنه تصفح وسماع أرشيف المنزل</p></div>
          </div>
          <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
            <div className="flex flex-col pr-1 flex-1"><div className="flex items-center gap-1.5"><span className="text-[14px] text-on-surface font-semibold">الوضع العائلي المقفل</span><Icon name="lock" size={16} className="text-secondary" /></div><span className="text-[13px] text-on-surface-variant mt-0.5">حصر الاستماع والقراءة فقط على الأجهزة المعتمدة داخل المنزل (أجهزة الأبوين واللوحي المشترك).</span></div>
            <Toggle on={family} onClick={() => setFamily((v) => !v)} />
          </div>
        </div>

        {/* Data sovereignty */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-md">
          <div className="flex items-center gap-space-xs pb-1">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary"><Icon name="fingerprint" size={20} /></div>
            <div className="flex flex-col"><h3 className="text-[17px] font-semibold text-primary">سيادة البيانات والتحكم الكامل</h3><p className="text-[13px] text-on-surface-variant">ذكرياتكم ملككم وحدكم، في أي لحظة وبكل شفافية</p></div>
          </div>
          <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-xs">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Icon name="download_for_offline" size={20} className="text-primary" /><span className="text-[14px] text-on-surface font-semibold">تصدير الأرشيف الشخصي</span></div><span className="text-[12px] text-on-surface-variant">ملف مضغوط (ZIP)</span></div>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">تحميل نسخة كاملة بدقة فائقة لجميع التسجيلات الصوتية، النصوص، والرسومات إلى ألبوم هاتفك أو التخزين الخارجي.</p>
            <button className="w-full h-[48px] rounded-full bg-surface-container-high hover:bg-surface-container-highest text-primary text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98]"><Icon name="ios_share" size={20} /><span>تصدير كافة الحكايات والملفات</span></button>
          </div>
          <div className="p-space-sm rounded-lg bg-surface-container-high/50 flex flex-col gap-space-xs">
            <div className="flex items-center gap-2 text-secondary"><Icon name="warning" size={20} /><span className="text-[14px] font-semibold">منطقة الإلغاء النهائي</span></div>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">بمجرد تأكيد الحذف، سيتم محو كافة نصوص القصص، التسجيلات الصوتية، وسجلات الشخصيات فورياً من الخوادم المشفرة دون إمكانية استرجاعها إطلاقاً.</p>
            <button onClick={() => setConfirm(true)} className="w-full h-[50px] rounded-full bg-tertiary-container hover:bg-tertiary text-on-tertiary text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"><Icon name="delete_forever" size={20} /><span>حذف كافة بيانات العائلة والقصص نهائياً</span></button>
          </div>
        </div>

        {/* Seal */}
        <div className="flex flex-col items-center justify-center text-center pt-space-xs pb-space-md px-space-md">
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary-container mb-2"><Icon name="workspace_premium" size={22} /></div>
          <span className="text-[14px] text-primary font-semibold">ميثاق شرف حكايات العائلة</span>
          <p className="text-[13px] text-on-surface-variant max-w-[280px] mt-1">لا إعلانات، لا تعقب تجاري، ولا مشاركة لبيانات القصص العائلية مع طرف ثالث أبداً.</p>
        </div>
      </main>

      {confirm && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center px-margin" onClick={() => setConfirm(false)}>
          <div className="bg-surface-container-lowest rounded-2xl p-space-md max-w-sm w-full shadow-xl flex flex-col gap-space-sm" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-error mx-auto"><Icon name="delete_forever" size={26} /></div>
            <h3 className="text-[17px] font-semibold text-primary text-center">تأكيد الحذف النهائي</h3>
            <p className="text-[13px] text-on-surface-variant text-center">هذا إجراء لا يمكن التراجع عنه. (نموذج أولي — لن يُحذف شيء فعليًا.)</p>
            <div className="flex gap-2.5 mt-1">
              <button onClick={() => setConfirm(false)} className="flex-1 h-11 rounded-full bg-surface-container text-primary text-[14px] font-semibold">إلغاء</button>
              <button onClick={() => setConfirm(false)} className="flex-1 h-11 rounded-full bg-error text-on-error text-[14px] font-semibold">تأكيد</button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </>
  );
}
