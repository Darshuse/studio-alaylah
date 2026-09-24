"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { api, getToken } from "@/lib/api";
import { READY_STORIES, renderStory, type Gender, type ReadyStory } from "@/lib/readyStories";

const NAME_KEY = "ft_hero_name";
const GENDER_KEY = "ft_hero_gender";
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} };

/** شريط حكايات جاهزة قابل للتمرير — الضغط على واحدة يفتح ورقة التأكيد. */
export function ReadyStoryRow({ onOpen }: { onOpen: (s: ReadyStory) => void }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto -mx-margin px-margin pb-1">
      {READY_STORIES.map((s) => (
        <button
          key={s.id}
          onClick={() => onOpen(s)}
          className="shrink-0 w-[148px] rounded-2xl bg-surface-container-lowest border border-outline-variant p-3 text-right flex flex-col gap-2 active:scale-[0.98] transition-transform"
        >
          <span className="w-10 h-10 rounded-xl bg-primary-container text-secondary-container flex items-center justify-center">
            <Icon name={s.icon} size={22} fill />
          </span>
          <span className="text-[13.5px] font-bold text-primary leading-snug">{s.title}</span>
          <span className="text-[11.5px] text-on-surface-variant leading-snug">{s.teaser}</span>
        </button>
      ))}
    </div>
  );
}

/** ورقة التأكيد: اسم البطل + الجنس + معاينة النص، ثم «استخدم هذه الحكاية». */
export function ReadyStorySheet({
  story, busy, onClose, onUse,
}: { story: ReadyStory; busy?: boolean; onClose: () => void; onUse: (title: string, text: string) => void }) {
  const [name, setName] = useState(read(NAME_KEY) || "");
  const [gender, setGender] = useState<Gender>((read(GENDER_KEY) as Gender) || "m");

  // اقتراح الاسم من أول بطل مسجّل (لو لسه ما اتحدّدش اسم)
  useEffect(() => {
    if (name || !getToken()) return;
    api.listCharacters().then((cs) => {
      const hero = cs.find((c) => c.ageLabel !== "الراوي");
      if (hero) setName(hero.displayName);
    }).catch(() => {});
  }, [name]);

  const text = renderStory(story.text, name, gender);
  const use = () => {
    write(NAME_KEY, name.trim()); write(GENDER_KEY, gender);
    onUse(story.title, text);
  };

  return (
    <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-end justify-center" onClick={onClose}>
      <div className="bg-surface-container-lowest w-full max-w-md rounded-t-3xl p-space-lg shadow-xl flex flex-col gap-space-sm max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-surface-container-highest mx-auto" />
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-primary-container text-secondary-container flex items-center justify-center shrink-0"><Icon name={story.icon} size={24} fill /></span>
          <div className="flex flex-col min-w-0">
            <h3 className="text-[18px] font-bold text-primary">{story.title}</h3>
            <span className="text-[12px] text-on-surface-variant">{story.teaser}</span>
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[12.5px] text-on-surface-variant">اسم بطل الحكاية</span>
          <input
            value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلًا: يوسف"
            className="h-12 rounded-xl bg-surface-container-low px-4 text-[15px] text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 text-right"
          />
        </label>

        <div className="grid grid-cols-2 gap-2" role="group" aria-label="جنس البطل">
          {([["m", "ولد", "boy"], ["f", "بنت", "girl"]] as const).map(([g, label, ic]) => (
            <button
              key={g} onClick={() => setGender(g)} aria-pressed={gender === g}
              className={`h-11 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                gender === g ? "bg-primary-container text-on-primary border-transparent" : "bg-surface-container-lowest text-on-surface border-outline-variant"
              }`}
            >
              <Icon name={ic} size={18} fill={gender === g} />{label}
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-surface-container-low p-3 overflow-y-auto max-h-[28vh]">
          <p className="text-[13.5px] leading-[24px] text-on-surface whitespace-pre-line">{text}</p>
        </div>

        <button
          disabled={busy || !name.trim()} onClick={use}
          className="w-full h-[52px] rounded-full bg-secondary text-on-secondary text-[16px] font-semibold flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(217,130,59,0.35)] active:scale-[0.98] disabled:opacity-50"
        >
          <Icon name={busy ? "progress_activity" : "check"} size={22} className={busy ? "animate-spin" : ""} />
          <span>{busy ? "جارٍ التجهيز..." : "استخدم هذه الحكاية"}</span>
        </button>
        <button onClick={onClose} className="w-full h-10 rounded-full text-on-surface-variant text-[14px]">إلغاء</button>
      </div>
    </div>
  );
}
