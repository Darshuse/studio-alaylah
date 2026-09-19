"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

const ITEMS = [
  { href: "/", icon: "auto_stories", label: "بدء حكاية" },
  { href: "/archive", icon: "photo_album", label: "أرشيف العائلة" },
  { href: "/characters", icon: "diversity_1", label: "شخصياتنا" },
  { href: "/privacy", icon: "lock", label: "الأمان" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="sticky bottom-0 z-40 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(31,36,33,0.04)]">
      <div className="flex items-center justify-around h-16 px-space-xs">
        {ITEMS.map((it) => {
          const active = path === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center justify-center min-w-[44px] flex-1 py-1 transition-colors ${
                active ? "text-primary font-semibold" : "text-on-surface-variant"
              }`}
            >
              <Icon name={it.icon} fill={active} />
              <span className="text-[12px] leading-[18px] font-medium mt-0.5">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
