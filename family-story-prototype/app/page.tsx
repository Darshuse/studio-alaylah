"use client";

import { useState } from "react";
import { Check, ChevronLeft, LockKeyhole, Mic, Pause, Play, Sparkles } from "lucide-react";

const steps = ["الحكاية", "أبطال القصة", "المشهد الأول"];

export default function Home() {
  const [step, setStep] = useState(0);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [name, setName] = useState("ليان");
  const next = () => setStep((value) => Math.min(2, value + 1));

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f5ef] text-[#173b40]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1a6266] text-lg text-[#f7d69a]">✦</span>
          <div><p className="font-extrabold">استوديو حكايات العائلة</p><p className="text-xs text-[#6d8181]">مساحة العائلة الخاصة</p></div>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#4d6668] shadow-sm sm:flex"><LockKeyhole size={14} /> خاصة بك وبعائلتك فقط</div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_.7fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-[0_24px_70px_rgba(31,66,65,.10)] sm:p-9">
            <div className="mb-8 flex items-center justify-between gap-2">
              {steps.map((label, index) => <div key={label} className="flex flex-1 items-center gap-2 last:flex-none">
                <button onClick={() => index <= step && setStep(index)} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${index < step ? "bg-[#1a6266] text-white" : index === step ? "bg-[#dd9146] text-white ring-4 ring-[#f8ebdb]" : "bg-[#edf1ee] text-[#7d9291]"}`}>{index < step ? <Check size={16} /> : index + 1}</button>
                <span className={`hidden text-sm font-bold sm:block ${index === step ? "" : "text-[#8a9998]"}`}>{label}</span>{index < 2 && <span className="h-px flex-1 bg-[#e5e9e5]" />}
              </div>)}
            </div>

            {step === 0 && <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf4f2] px-3 py-1 text-xs font-bold text-[#1a6266]"><Mic size={14} /> الخطوة الأولى</span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">احكِ ذكرى تريد أن تعيشها العائلة من جديد.</h1>
              <p className="mt-3 max-w-xl leading-7 text-[#617779]">سجّلها بصوتك كما تتذكرها. لا تحتاج إلى نص مثالي - يكفي أن تكون الحكاية منك.</p>
              <div className="mt-8 rounded-3xl border border-dashed border-[#b8cbc7] bg-[#f7fbfa] p-7 text-center">
                <button onClick={() => setRecording(!recording)} className={`grid mx-auto h-20 w-20 place-items-center rounded-full text-white shadow-lg ${recording ? "bg-[#c85e53]" : "bg-[#1a6266]"}`}>{recording ? <Pause size={30} fill="currentColor" /> : <Mic size={30} />}</button>
                <p className="mt-4 font-extrabold">{recording ? "نسجّل الآن..." : "اضغط لتبدأ التسجيل"}</p><p className="mt-1 text-sm text-[#78908e]">مدة مقترحة: دقيقة إلى ثلاث دقائق</p>
                {recording && <div className="mx-auto mt-6 flex max-w-xs items-end justify-center gap-1">{[18,34,25,48,30,58,23,42,19,36,50,27].map((h, i) => <span key={i} className="w-1.5 animate-pulse rounded-full bg-[#dd9146]" style={{height:h, animationDelay:`${i * 90}ms`}} />)}</div>}
              </div>
              <button onClick={next} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#173b40] px-5 py-4 font-bold text-white">لدي حكاية جاهزة <ChevronLeft size={18} /></button>
            </div>}

            {step === 1 && <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf4f2] px-3 py-1 text-xs font-bold text-[#1a6266]"><Sparkles size={14} /> بطاقة الهوية</span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">من هم أبطال هذه الذكرى؟</h1><p className="mt-3 leading-7 text-[#617779]">سنستخدم هذه البطاقة في كل مشهد كي تبقى العائلة مألوفة عبر القصة.</p>
              <div className="mt-7 grid gap-4 sm:grid-cols-[150px_1fr]"><div className="grid min-h-40 place-items-center rounded-3xl bg-[radial-gradient(circle_at_50%_30%,#f8d7a8_0_18%,#cc8761_19%_34%,#609093_35%_100%)] text-5xl">👧</div><div className="rounded-3xl bg-[#f7f5ef] p-5"><label className="text-sm font-bold">اسم البطلة</label><input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-[#dce5e0] bg-white px-4 py-3 font-bold outline-none" /><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-white px-3 py-2 text-xs font-bold">ابنتي</span><span className="rounded-full bg-white px-3 py-2 text-xs font-bold">5 سنوات</span><span className="rounded-full bg-white px-3 py-2 text-xs font-bold">أسلوب مرسوم</span></div></div></div>
              <div className="mt-5 rounded-2xl bg-[#fff4e5] px-4 py-3 text-sm leading-6 text-[#7c5425]">يمكنك مراجعة الصورة والاسم قبل إنشاء الفيلم. لا ننشر أي صورة تلقائيًا.</div>
              <button onClick={next} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#173b40] px-5 py-4 font-bold text-white">صمّم المشهد الأول <ChevronLeft size={18} /></button>
            </div>}

            {step === 2 && <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf4f2] px-3 py-1 text-xs font-bold text-[#1a6266]"><Sparkles size={14} /> المعاينة</span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">هذه بداية حكاية {name || "طفلك"}.</h1><p className="mt-3 leading-7 text-[#617779]">معاينة قصيرة لتتأكد أن الجو والشخصيات يشبهون عائلتكم قبل إنشاء الفيلم.</p>
              <div className="relative mt-7 aspect-video overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#173b40_0%,#296e70_45%,#e6a55b_150%)] p-6"><div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_50%_100%,#f5c77d_0_7%,transparent_8%),radial-gradient(ellipse_at_15%_80%,#244f54_0_20%,transparent_21%),radial-gradient(ellipse_at_85%_80%,#244f54_0_20%,transparent_21%)] opacity-75" /><div className="relative flex h-full flex-col justify-between"><p className="text-sm font-bold text-[#fbebc9]">في مساءٍ هادئ، بدأت حكاية لا تُنسى...</p><div className="flex items-end justify-between"><button onClick={() => setPlaying(!playing)} className="grid h-14 w-14 place-items-center rounded-full bg-white text-[#173b40]">{playing ? <Pause size={23} fill="currentColor" /> : <Play size={23} fill="currentColor" className="mr-1" />}</button><span className="rounded-full bg-[#173b40]/50 px-3 py-1 text-xs text-white">00:18</span></div></div></div>
              <div className="mt-6 flex gap-3"><button onClick={() => setStep(0)} className="flex-1 rounded-2xl border border-[#d9e2df] py-4 font-bold">تعديل الحكاية</button><button onClick={() => alert("هذه معاينة نموذج أولي. في المنتج الفعلي ستظهر هنا خيارات طلب الفيلم وحفظه.")} className="flex-1 rounded-2xl bg-[#dd9146] py-4 font-bold text-white">أعجبتني - احفظها</button></div>
            </div>}
          </div>

          <aside className="rounded-[2rem] bg-[#173b40] p-6 text-white shadow-[0_24px_70px_rgba(31,66,65,.16)] sm:p-8"><p className="text-sm font-bold text-[#f0bf76]">لماذا هذه الرحلة قصيرة؟</p><h2 className="mt-3 text-2xl font-extrabold leading-tight">لأن الذكرى أهم من إعدادات الإنتاج.</h2><div className="mt-7 space-y-5 text-sm leading-6 text-[#d9e8e5]"><p><b className="text-white">للأهل:</b> تبدأون بالصوت؛ لا بسلسلة حقول مرهقة.</p><p><b className="text-white">للطفل:</b> يرى أشخاصًا مألوفين في عالم لطيف وآمن.</p><p><b className="text-white">للعائلة:</b> تحفظون الذكرى ضمن مساحة خاصة قابلة للحذف.</p></div><div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-6 text-[#f7e9cd]">«حكايتك بصوتك، وعائلتك أبطالها في كل مشهد.»</div></aside>
        </div>
      </section>
    </main>
  );
}
