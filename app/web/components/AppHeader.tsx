import Icon from "./Icon";

/** ترويسة التبويبات الرئيسية. icon محفوظ لتوافق الاستدعاءات الحالية (غير مستخدم بصريًا بعد اعتماد اللوجو). */
export default function AppHeader({ tab }: { tab: string; icon?: string }) {
  return (
    <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="h-16 px-margin flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="حكايات العائلة" className="w-9 h-9 rounded-full object-cover shadow-[0_2px_6px_rgba(31,36,33,0.08)]" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[17px] leading-[26px] font-semibold text-primary">حكايات العائلة</h1>
              <span className="text-on-surface-variant text-[12px]">•</span>
              <span className="text-[12px] leading-[18px] text-on-surface-variant font-medium">{tab}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span className="text-[12px] leading-[18px] text-on-surface-variant">أرشيف خاص ومحمي 🔒</span>
            </div>
          </div>
        </div>
        <button className="w-11 h-11 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-low transition-colors">
          <Icon name="favorite" size={22} />
        </button>
      </div>
    </header>
  );
}
